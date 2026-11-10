#!/usr/bin/env python3
"""Build public, per-question website records from existing SEE experiments.

Offline only: no model calls, rejudging, or mutations of source experiments.
Source SHA256s and counts are pinned in data/experiment_sources.json.
"""
from __future__ import annotations

import argparse
import gzip
import hashlib
import json
import re
from pathlib import Path
from urllib.parse import urlsplit

SITE = Path(__file__).resolve().parents[1]
WORKSPACE = SITE.parent
MIRROR = WORKSPACE / 'see-arxiv/experiments/local/see-cvpr'
LIVE = WORKSPACE.parent / 'see-cvpr'
CURRENT = MIRROR / 'data/results'
HISTORICAL = Path('/Users/hantaolin/Documents/past/SEE/data/results')


def read(path):
    return json.loads(path.read_text(encoding='utf-8'))


def sha(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def text(value):
    return '' if value is None else value if isinstance(value, str) else json.dumps(value, ensure_ascii=False)


def options(value):
    if isinstance(value, list):
        return value
    return [line.strip() for line in text(value).splitlines() if line.strip() and line.strip() != 'null']


def normalize(value):
    return re.sub(r'\s+', '', text(value))


def safe_url(value):
    return isinstance(value, str) and urlsplit(value).scheme in ('http', 'https')


def trace_step(call):
    kind = call.get('type', 'other')
    action = call.get('action') or {}
    queries = call.get('queries') or action.get('queries') or []
    if isinstance(queries, str):
        queries = [queries]
    if not queries and action.get('query'):
        queries = [action['query']]
    links = []
    for item in [*(action.get('sources') or []), *(call.get('results') or [])]:
        if isinstance(item, dict) and safe_url(item.get('url')):
            link = {'url': item['url'], 'title': text(item.get('title'))}
            if link not in links:
                links.append(link)
    if safe_url(action.get('url')):
        links.append({'url': action['url'], 'title': ''})
    # Copy text outputs only; never serialize provider envelopes, image base64,
    # request IDs, container tokens, or machine credentials into public assets.
    output = call.get('output')
    outputs = call.get('outputs') or []
    logs = [text(item.get('logs') or item.get('text')) for item in outputs if isinstance(item, dict) and item.get('type') != 'image']
    output = '\n'.join(filter(None, [text(output), *logs]))
    output = re.sub(r'''data:image/[^\s"'<>]+''', '[embedded image omitted]', output)
    result = {
        'type': kind,
        'detail': '\n'.join(text(query) for query in queries) if kind == 'search' else text(call.get('language') or call.get('provider_tool') or kind),
        'status': text(call.get('status') or call.get('outcome')),
        'code': text(call.get('code')),
        'output': output[:20000],
        'output_truncated': len(output) > 20000,
        'image_outputs': sum(isinstance(item, dict) and item.get('type') == 'image' for item in outputs),
        'sources': len(links),
        'links': links,
    }
    if kind == 'search' and not result['detail']:
        result['detail'] = text(action.get('type') or 'Search query not included in source record')
    if links:
        result['url'] = links[0]['url']
    return result


def response_record(row, name, mode, source_id, public):
    raw = row.get('model_response')
    parsed = raw if isinstance(raw, dict) else {}
    if isinstance(raw, str):
        try:
            candidate = json.loads(re.sub(r'^```(?:json)?\s*|\s*```$', '', raw.strip()), strict=False)
            if isinstance(candidate, dict):
                parsed = candidate
        except (ValueError, TypeError):
            pass
    answer = text(row.get('extracted_answer') or parsed.get('answer'))
    analysis = text(parsed.get('analysis'))
    if not parsed:
        analysis = text(raw)
    judge = row.get('judge_result')
    reference = text(row.get('answer') or row.get('答案'))
    input_question = row.get('question') or row.get('题目文本') or ''
    input_options = options(row.get('options', row.get('选项')))
    same_input = normalize(input_question) == normalize(public['question']) and normalize(input_options) == normalize(public['options'])
    result = {
        'model': name, 'mode': mode, 'source_id': source_id,
        'answer': answer, 'analysis': analysis,
        'judge_result': judge if isinstance(judge, bool) else None,
        'judge_reason': text(row.get('judge_reason')),
        'judge_model': text(row.get('judge_model')),
        'reference_answer': reference,
        'reference_matches_public': normalize(reference) == normalize(public['answer']),
        'input_matches_public': same_input,
        'generation_failed': bool(row.get('generate_error')),
        'latency_seconds': row.get('generate_latency'),
        'trace': [trace_step(call) for call in row.get('tool_calls', []) if isinstance(call, dict)],
    }
    if not same_input:
        result['input_question'] = input_question
        result['input_options'] = input_options
    return result


def source_path(original):
    marker = '/see-cvpr/'
    return MIRROR / original.split(marker, 1)[1] if marker in original else Path(original)


def build(output, config_path, current_root, historical_root, live_root=LIVE):
    bank = {q['id']: q for q in read(SITE / 'data/questions_public.json')}
    assert len(bank) == 1049
    config = read(config_path)
    roots = {'current': current_root, 'historical': historical_root, 'live': live_root}
    runs = []
    for item in config['runs']:
        assert item['mode'] in ('standard', 'tool'), 'Only standard and tool runs are supported'
        path = roots[item['root']] / item['file']
        assert sha(path) == item['sha256'], f'Source SHA mismatch: {path}'
        runs.append((item['model'], item['mode'], path, item.get('expected_correct')))
    assert len({(name, mode) for name, mode, _, _ in runs}) == len(runs), 'Duplicate model/mode'
    records = {qid: [] for qid in bank}
    metadata = []
    translations = {}
    for index, (name, mode, path, expected) in enumerate(runs):
        rows = read(path)
        assert len(rows) == 1116 and len({row['uuid'] for row in rows}) == 1116, path
        correct = sum(row.get('judge_result') is True for row in rows)
        assert expected is None or correct == expected, (name, correct, expected)
        source_id = f'run-{index + 1:02}'
        selected = [row for row in rows if row['uuid'] in bank]
        assert len(selected) == 1049, path
        for row in selected:
            qid = row['uuid']
            records[qid].append(response_record(row, name, mode, source_id, bank[qid]))
            if row.get('question_en') and qid not in translations:
                translations[qid] = {'question_en': row['question_en'], 'options_en': options(row.get('options_en'))}
        metadata.append({
            'id': source_id, 'model': name, 'mode': mode, 'sha256': sha(path),
            'source': config['runs'][index]['file'],
            'source_root': config['runs'][index]['root'],
            'note': config['runs'][index].get('note', ''),
            'full_count': len(rows), 'full_correct': correct,
            'public_count': len(selected), 'public_correct': sum(row.get('judge_result') is True for row in selected),
            'calls': sum(len(row.get('tool_calls', [])) for row in selected),
        })
        print(f'{source_id} {name}: {mode}, {correct}/1116; public {len(selected)}', flush=True)
    output.mkdir(parents=True, exist_ok=True)
    byte_count = 0
    for qid, responses in records.items():
        payload = {'id': qid, **translations.get(qid, {}), 'responses': responses}
        encoded = json.dumps(payload, ensure_ascii=False, separators=(',', ':')) + '\n'
        compressed = gzip.compress(encoded.encode(), mtime=0)
        (output / f'{qid}.json.gz').write_bytes(compressed)
        (output / f'{qid}.json').unlink(missing_ok=True)
        byte_count += len(compressed)
    manifest = {
        'version': hashlib.sha256(Path(__file__).read_bytes() + json.dumps(metadata, sort_keys=True).encode()).hexdigest()[:16],
        'scope': 'Public UUIDs only; standard multimodal and tool-augmented runs.',
        'question_count': len(bank), 'model_count': len({name for name, _, _, _ in runs}), 'run_count': len(runs),
        'response_count': sum(map(len, records.values())), 'bytes': byte_count,
        'runs': metadata,
        'questions': {qid: {'file': f'{qid}.json.gz', 'standard': sum(r['mode'] == 'standard' for r in rs), 'tool': sum(r['mode'] == 'tool' for r in rs), 'calls': sum(len(r['trace']) for r in rs)} for qid, rs in records.items()},
    }
    (output / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Exported {manifest["response_count"]} public responses, {byte_count / 1e6:.1f} MB')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=SITE / 'data/experiments')
    parser.add_argument('--sources', type=Path, default=SITE / 'data/experiment_sources.json')
    parser.add_argument('--current-root', type=Path, default=MIRROR)
    parser.add_argument('--historical-root', type=Path, default=HISTORICAL)
    parser.add_argument('--live-root', type=Path, default=LIVE)
    args = parser.parse_args()
    build(args.output, args.sources, args.current_root, args.historical_root, args.live_root)
