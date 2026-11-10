import unittest

from export_site_experiments import response_record, trace_step


class ExportTests(unittest.TestCase):
    def test_multiline_response_and_original_false_judgment_are_preserved(self):
        public = {'question': 'Q', 'options': [], 'answer': 'A'}
        row = {'question': 'Q', 'options': [], 'answer': 'A', 'model_response': '{"analysis":"line one\nline two", "answer":"B"}', 'judge_result': False}
        record = response_record(row, 'Model', 'standard', 'run-01', public)
        self.assertEqual(record['answer'], 'B')
        self.assertEqual(record['analysis'], 'line one\nline two')
        self.assertIs(record['judge_result'], False)

    def test_missing_judgment_and_reference_version_are_explicit(self):
        public = {'question': 'Q', 'options': [], 'answer': 'A'}
        record = response_record({'question': 'Older Q', 'answer': 'B'}, 'Model', 'tool', 'run-02', public)
        self.assertIsNone(record['judge_result'])
        self.assertFalse(record['input_matches_public'])
        self.assertFalse(record['reference_matches_public'])
        self.assertEqual(record['reference_answer'], 'B')

    def test_only_safe_links_and_text_outputs_are_exported(self):
        call = {'type': 'code', 'code': 'print(1)', 'request_id': 'private', 'container_id': 'private', 'outputs': [{'type': 'logs', 'logs': 'data:image/png;base64,AAAA\n' + 'x' * 21000}, {'type': 'image', 'url': 'data:image/png;base64,BBBB'}], 'action': {'sources': [{'url': 'javascript:alert(1)'}, {'url': 'https://example.org/paper'}]}}
        step = trace_step(call)
        self.assertEqual(step['image_outputs'], 1)
        self.assertTrue(step['output_truncated'])
        self.assertEqual(len(step['output']), 20000)
        self.assertNotIn('data:image', step['output'])
        self.assertEqual(step['links'], [{'url': 'https://example.org/paper', 'title': ''}])
        self.assertNotIn('container_id', step)
        self.assertNotIn('request_id', step)


if __name__ == '__main__':
    unittest.main()
