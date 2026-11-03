"""CI-only preview boundary. No live host, writes, redirects or sockets."""
from urllib.parse import urlsplit


def preview_origin(url):
    p = urlsplit(url)
    if p.scheme != 'http' or p.hostname != '127.0.0.1' or p.port != 4173 or p.username or p.password:
        raise ValueError('Only the fixed local CI preview is allowed')
    return (p.scheme, p.hostname, p.port)


def is_ranking_read(request):
    p = urlsplit(request.url)
    if p.scheme != 'https' or p.hostname != 'mlpnjgezrnhdxsxolyzj.supabase.co' or p.port not in (None,443) or p.username or p.password or p.query or p.fragment or p.path != '/rest/v1/rpc/get_best_score_ranking' or request.method != 'POST':
        return False
    try:
        body = request.post_data_json
    except Exception:
        return False
    return isinstance(body, dict) and set(body) == {'p_game_slug','p_limit'} and body['p_game_slug'] in ('sabasaba_normal','sabasaba_endless') and type(body['p_limit']) is int and body['p_limit'] == 30


def install_boundary(context, url, blocked, mocked_reads=None):
    origin = preview_origin(url)

    def route_request(route):
        request = route.request
        if is_ranking_read(request):
            if mocked_reads is not None: mocked_reads.append('get_best_score_ranking')
            route.fulfill(status=200, content_type='application/json', body='[]')
            return
        p = urlsplit(request.url)
        # Explicit empty CSS fixture: CI system fonts only, never fetch Google.
        if p.scheme == 'https' and p.hostname == 'fonts.googleapis.com' and p.path in ('/css', '/css2') and request.method == 'GET' and not p.username and not p.password and p.port in (None,443):
            route.fulfill(status=200, content_type='text/css', body='/* isolated CI font fixture */')
            return
        if (p.scheme, p.hostname, p.port) != origin or p.username or p.password:
            blocked.append('external-origin')
            route.abort()
            return
        if request.method not in ('GET', 'HEAD'):
            blocked.append('non-static-method')
            route.abort()
            return
        response = route.fetch(max_redirects=0, max_retries=2)
        if 300 <= response.status < 400:
            blocked.append('redirect')
            route.abort()
            return
        route.fulfill(response=response)

    def close_socket(socket):
        blocked.append('websocket')
        socket.close()

    context.route('**/*', route_request)
    context.route_web_socket('**/*', close_socket)
