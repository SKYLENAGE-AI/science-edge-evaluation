"""Export aggregate no-tool scores for the common and discipline leaderboards."""
import argparse
from collections import defaultdict
import json
from pathlib import Path
import re

from export_site_experiments import HISTORICAL, MIRROR, SITE, WORKSPACE, read, sha

# The 17 subdisciplines reported in the benchmark analysis.
DISCIPLINES = {
    '化学': (
        ('分析化学', 'Analytical Chemistry'),
        ('物理化学', 'Physical Chemistry'),
        ('有机化学', 'Organic Chemistry'),
        ('高分子化学和物理', 'Polymer Chemistry and Physics'),
        ('无机化学', 'Inorganic Chemistry'),
    ),
    '生物学': (
        ('生物化学', 'Biochemistry'),
        ('分子生物学', 'Molecular Biology'),
        ('细胞生物学', 'Cell Biology'),
        ('结构生物学', 'Structural Biology'),
        ('生物物理学', 'Biophysics'),
        ('遗传学', 'Genetics'),
        ('免疫学', 'Immunology'),
        ('生理学', 'Physiology'),
    ),
    '材料科学': (
        ('有机和高分子材料', 'Organic and Polymer Materials'),
        ('无机非金属材料', 'Inorganic Non-metallic Materials'),
        ('复合材料', 'Composite Materials'),
        ('金属材料', 'Metallic Materials'),
    ),
}
REFUSAL_REASONS = {'refusal', 'content_filter', 'safety', 'blocked', 'content_filtered'}
REFUSAL_ERROR = re.compile(r'\brefusal\b|拒绝回答|拒答|content.policy|data.?inspection|content.?filter', re.I)


def export(input_file, live_root, output):
    public = read(SITE / 'data/questions_public.json')
    examples = defaultdict(list)
    for question in public:
        for tag in question['subject_tags']:
            examples[tag].append(set(question['main_disciplines']))
    tags = {tag: set.intersection(*labels) for tag, labels in examples.items()}
    assert all(len(labels) == 1 for labels in tags.values())
    assert tags == {tag: {parent} for parent, children in DISCIPLINES.items() for tag, _ in children}
    tags['生态学'] = {'生物学'}
    subject_tags = {row['uuid']: set(row['level1_subject_tag']) for row in read(input_file)}
    disciplines = {
        uuid: set.union(*(tags[tag] for tag in labels))
        for uuid, labels in subject_tags.items()
    }
    assert len(disciplines) == 1116
    assert all(disciplines[row['id']] == set(row['main_disciplines']) for row in public)

    repair = live_root / 'data/results/baseline_muse_wonder_20261119/muse-wonder-1.0/transport_repair_20261119/records'
    muse_refusals = set()
    for path in repair.glob('*.json'):
        row = read(path)
        if 'content_policy_violation' in str(row.get('generate_error')).lower():
            muse_refusals.add(row['uuid'])
    assert len(muse_refusals) == 4

    roots = {'current': MIRROR, 'historical': HISTORICAL, 'live': live_root}
    manifest = read(SITE / 'data/experiments/manifest.json')
    manifest_runs = {run['model']: run for run in manifest['runs'] if run['mode'] == 'standard'}
    common = set(disciplines)
    correct = {}
    for run in read(SITE / 'data/experiment_sources.json')['runs']:
        if run['mode'] != 'standard':
            continue
        model = run['model']
        path = roots[run['root']] / run['file']
        assert sha(path) == run['sha256'] == manifest_runs[model]['sha256']
        rows = read(path)
        assert len(rows) == len(disciplines) and {r['uuid'] for r in rows} == set(disciplines)
        correct[model] = {r['uuid'] for r in rows if r.get('judge_result') is True}
        assert len(correct[model]) == manifest_runs[model]['full_correct']
        for row in rows:
            error = str(row.get('generate_error') or '')
            no_answer = not row.get('model_response')
            refusal = str(row.get('finish_reason') or '').lower() in REFUSAL_REASONS
            refusal |= no_answer and bool(REFUSAL_ERROR.search(error))
            refusal |= model == 'Claude Fable 5.2' and no_answer and error == '模型返回为空'
            refusal |= model == 'Muse Wonder' and row['uuid'] in muse_refusals
            if refusal:
                common.discard(row['uuid'])

    def scores(ids):
        return {'questions': len(ids), 'correct': {model: len(ids & hits) for model, hits in correct.items()}}

    def scoped_scores(name, labels_by_id):
        questions = {uuid for uuid, labels in labels_by_id.items() if name in labels}
        return {'full': scores(questions), 'common': scores(questions & common)}

    result = {
        'manifest_version': manifest['version'],
        'model_count': len(correct),
        'common': scores(common),
        'disciplines': {parent: scoped_scores(parent, disciplines) for parent in DISCIPLINES},
        'subdisciplines': {
            parent: [
                {'zh': tag, 'en': en, **scoped_scores(tag, subject_tags)} for tag, en in children
            ]
            for parent, children in DISCIPLINES.items()
        },
    }
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(f"Exported scores for {len(correct)} models on {len(common)} common questions")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', type=Path, default=WORKSPACE / 'mllm_science/data/frontierlab-260617-data/cleaned_export_20260617.json')
    parser.add_argument('--live-root', type=Path, default=WORKSPACE / 'see-cvpr')
    parser.add_argument('--output', type=Path, default=SITE / 'data/leaderboard_views.json')
    args = parser.parse_args()
    export(args.input, args.live_root, args.output)
