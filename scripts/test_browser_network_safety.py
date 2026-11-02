import unittest
from types import SimpleNamespace
from browser_network_safety import install_boundary, preview_origin

class BoundaryTests(unittest.TestCase):
    def test_url_boundary(self):
        self.assertEqual(preview_origin('http://127.0.0.1:4173/sabasaba/'), ('http','127.0.0.1',4173))
        for url in ['https://example.com/', 'http://localhost:4173/', 'http://127.0.0.1:80/', 'http://user@127.0.0.1:4173/']:
            with self.assertRaises(ValueError): preview_origin(url)

    def test_requests_and_websocket(self):
        callbacks = {}; blocked = []
        context = SimpleNamespace(route=lambda _, cb: callbacks.update(http=cb), route_web_socket=lambda _, cb: callbacks.update(ws=cb))
        install_boundary(context, 'http://127.0.0.1:4173/sabasaba/', blocked)
        for url, method, status, expected in [
            ('http://127.0.0.1:4173/a.js','GET',200,'fulfill'),
            ('http://127.0.0.1:4173/a.js','HEAD',200,'fulfill'),
            ('https://fonts.googleapis.com/css2?family=Inter','GET',200,'fulfill'),
            ('https://example.com/','GET',200,'abort'),
            ('http://127.0.0.1:4173/api','POST',200,'abort'),
            ('http://127.0.0.1:4173/api','DELETE',200,'abort'),
            ('http://127.0.0.1:4173/a.js','GET',302,'abort')]:
            calls=[]
            def fetch(**kw):
                self.assertEqual(kw, {'max_redirects':0,'max_retries':2}); calls.append('fetch'); return SimpleNamespace(status=status)
            route=SimpleNamespace(request=SimpleNamespace(url=url,method=method),fetch=fetch,abort=lambda:calls.append('abort'),fulfill=lambda **_:calls.append('fulfill'))
            callbacks['http'](route); self.assertEqual(calls[-1],expected)
            if method not in ('GET','HEAD') or url.startswith('https:'):self.assertNotIn('fetch',calls)
        closed=[];callbacks['ws'](SimpleNamespace(close=lambda:closed.append(True)))
        self.assertEqual(closed,[True]);self.assertEqual(blocked,['external-origin','non-static-method','non-static-method','redirect','websocket'])

if __name__ == '__main__': unittest.main()
