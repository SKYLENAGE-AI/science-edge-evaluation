#!/usr/bin/env python3
"""Validate public website assets; optionally assemble a GitHub Pages artifact."""
import argparse
import gzip
import json
import shutil
from collections import Counter
from pathlib import Path

SITE = Path(__file__).resolve().parents[1]


def verify():
    bank = json.loads((SITE / 'data/questions_public.json').read_text())
    manifest = json.loads((SITE / 'data/experiments/manifest.json').read_text())
    ids = {question['id'] for question in bank}
    assert set(manifest['questions']) == ids, 'Manifest must cover exactly the public UUIDs'
    sources = {run['id']: run for run in manifest['runs']}
    assert len(sources) == manifest['run_count']
    assert len({run['model'] for run in sources.values()}) == manifest['model_count']
    assert set(run['mode'] for run in sources.values()) <= {'standard', 'tool'}
    public_correct = Counter()
    total = 0
    for qid, entry in manifest['questions'].items():
        path = SITE / 'data/experiments' / entry['file']
        assert path.parent == SITE / 'data/experiments', 'Unexpected shard path'
        payload = json.loads(gzip.decompress(path.read_bytes()))
        assert payload['id'] == qid
        assert {response['source_id'] for response in payload['responses']} == set(sources)
        assert len(payload['responses']) == len(sources), 'Duplicate or missing run'
        for mode in ('standard', 'tool'):
            assert sum(response['mode'] == mode for response in payload['responses']) == entry[mode]
        for response in payload['responses']:
            run = sources[response['source_id']]
            assert response['model'] == run['model'] and response['mode'] == run['mode']
            assert response['judge_result'] is None or isinstance(response['judge_result'], bool)
            assert isinstance(response['answer'], str) and isinstance(response['analysis'], str)
            assert all(step['type'] in ('search', 'code') for step in response['trace'])
            assert 'data:image/' not in json.dumps(response), 'Image binary leaked into text export'
            public_correct[run['id']] += response['judge_result'] is True
            total += 1
    assert total == manifest['response_count']
    for run in sources.values():
        assert public_correct[run['id']] == run['public_correct'], run['model']
    for question in bank:
        for image in question['images']:
            path = SITE / image
            assert path.is_file(), f'Missing question image: {image}'
            with path.open('rb') as stream:
                assert not stream.read(80).startswith(b'version https://git-lfs'), f'Unresolved LFS pointer: {image}'
    html = (SITE / 'index.html').read_text()
    assert 'tab-ablation' not in html
    assert 'https://arxiv.org/abs/2608.06931' in html
    print(f'Validated {len(ids)} public questions, {manifest["model_count"]} models, {total} responses; standard + tools only.')


def assemble(destination):
    destination.mkdir(parents=True, exist_ok=True)
    for filename in ('index.html', 'script.js', 'styles.css', 'blue-theme.css', 'favicon.svg'):
        shutil.copy2(SITE / filename, destination / filename)
    for folder in ('assets', 'prompts'):
        shutil.copytree(SITE / folder, destination / folder, dirs_exist_ok=True)
    public_docs = destination / 'docs'
    public_docs.mkdir(exist_ok=True)
    for path in public_docs.iterdir():
        if path.is_file() and path.name != 'evaluation_protocol.md':
            path.unlink()
    shutil.copy2(SITE / 'docs/evaluation_protocol.md', public_docs / 'evaluation_protocol.md')
    (destination / 'data').mkdir(exist_ok=True)
    for filename in ('questions_public.json', 'questions_public.jsonl', 'schema.md'):
        shutil.copy2(SITE / 'data' / filename, destination / 'data' / filename)
    shutil.copytree(SITE / 'data/experiments', destination / 'data/experiments', dirs_exist_ok=True)
    shutil.copytree(SITE / 'data/images', destination / 'data/images', dirs_exist_ok=True)
    shutil.copy2(SITE / 'data/site_examples.json', destination / 'data/site_examples.json')
    (destination / '.nojekyll').touch()
    print(f'Assembled static website at {destination}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--build', type=Path)
    args = parser.parse_args()
    verify()
    if args.build:
        assemble(args.build.resolve())
