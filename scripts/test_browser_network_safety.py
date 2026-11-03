import unittest
from types import SimpleNamespace
from browser_network_safety import install_boundary, preview_origin, is_ranking_read

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

    def test_read_fixture_is_exact_and_never_fetches(self):
        url='https://mlpnjgezrnhdxsxolyzj.supabase.co/rest/v1/rpc/get_best_score_ranking'
        valid={'p_game_slug':'sabasaba_normal','p_limit':30}
        for body,ok in [(valid,True),({'p_game_slug':'sabasaba_endless','p_limit':30},True),({'p_game_slug':'other','p_limit':30},False),({'p_game_slug':'sabasaba_normal','p_limit':True},False),({'p_game_slug':'sabasaba_normal','p_limit':100},False),({**valid,'score':1},False)]:
            request=SimpleNamespace(url=url,method='POST',post_data_json=body)
            self.assertEqual(is_ranking_read(request),ok)
        for bad in [url+'?x=1',url.replace('get_best_score_ranking','start_sabasaba_run'),url.replace('get_best_score_ranking','submit_sabasaba_run'),url.replace('.co/','.co.evil/')]:
            self.assertFalse(is_ranking_read(SimpleNamespace(url=bad,method='POST',post_data_json=valid)))
        callbacks={};blocked=[];reads=[];calls=[]
        context=SimpleNamespace(route=lambda _,cb:callbacks.update(http=cb),route_web_socket=lambda _,cb:None)
        install_boundary(context,'http://127.0.0.1:4173/sabasaba/',blocked,reads)
        def fetch(**_):raise AssertionError('fixture must never reach the network')
        route=SimpleNamespace(request=SimpleNamespace(url=url,method='POST',post_data_json=valid),fetch=fetch,fulfill=lambda **kw:calls.append(kw),abort=lambda:calls.append('abort'))
        callbacks['http'](route)
        self.assertEqual(calls,[{'status':200,'content_type':'application/json','body':'[]'}]);self.assertEqual(reads,['get_best_score_ranking']);self.assertEqual(blocked,[])

if __name__ == '__main__': unittest.main()
