"""CI helper: `zmp login` (QR) then `zmp deploy`, without a human at the terminal.
Writes OUT/qr<N>.png whenever a fresh login QR appears (a person scans it with Zalo),
then OUT/result.txt and OUT/done when finished. No secrets are read or printed."""
import os, pty, re, select, struct, sys, time, zlib

OUT = os.environ.get('OUT', '/tmp/zout')
APP_ID = os.environ['APP_ID']
STATUS = os.environ.get('STATUS', 'development')
NOTE = (os.environ.get('NOTE') or 'cap nhat').replace('\n', ' ')[:200]
ANSI = re.compile(r'\x1b\[[0-9;?]*[A-Za-z]')
os.makedirs(OUT, exist_ok=True)


def png(path, mat, scale=12, quiet=4):
    n, w = len(mat), len(mat[0])
    W, H = (w + 2 * quiet) * scale, (n + 2 * quiet) * scale
    rows = []
    for y in range(H):
        my = y // scale - quiet
        row = bytearray([0])
        for x in range(W):
            mx = x // scale - quiet
            row.append(0 if 0 <= my < n and 0 <= mx < w and mat[my][mx] else 255)
        rows.append(bytes(row))
    def chunk(t, d):
        c = struct.pack('>I', len(d)) + t + d
        return c + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    data = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', W, H, 8, 0, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(b''.join(rows), 6)) + chunk(b'IEND', b'')
    tmp = path + '.tmp'
    open(tmp, 'wb').write(data)
    os.replace(tmp, path)


def parse_qr(text):
    blk = [l.rstrip('\r') for l in text.split('\n') if l.strip() and set(l.strip()) <= set('█▀▄ ') and len(l) > 20]
    mat = []
    for l in blk:  # terminal QR: '█' light/light, '▀' light over dark, '▄' dark over light, ' ' dark/dark
        mat.append([c not in '█▀' for c in l])
        mat.append([c not in '█▄' for c in l])
    return mat


def log(s):
    print(time.strftime('%H:%M:%S'), s, flush=True)


def spawn(args):
    pid, fd = pty.fork()
    if pid == 0:
        os.execvp('npx', ['npx', 'zmp'] + args)
    return pid, fd


def finish(ok, msg):
    open(f'{OUT}/result.txt', 'w').write(('OK ' if ok else 'FAIL ') + msg + '\n')
    open(f'{OUT}/done', 'w').write('1')
    log(('OK ' if ok else 'FAIL ') + msg)
    sys.exit(0 if ok else 1)


# ── 1. login (QR) ─────────────────────────────────────────────────────────────
logged_in = False
for attempt in range(1, 7):
    pid, fd = spawn(['login'])
    buf = b''
    step, qr_done, end = 0, False, time.time() + 110
    while time.time() < end:
        r, _, _ = select.select([fd], [], [], 1)
        if r:
            try:
                d = os.read(fd, 4096)
            except OSError:
                break
            if not d:
                break
            buf += d
            txt = ANSI.sub('', buf.decode('utf8', 'ignore'))
            if step == 0 and 'Mini App ID' in txt:
                os.write(fd, APP_ID.encode() + b'\r'); step = 1
            if step < 2 and 'Choose a Login Method' in txt:
                time.sleep(1); os.write(fd, b'\r'); step = 2
            if step == 2 and not qr_done and 'Scan the QR code' in txt:
                time.sleep(1.5)
                txt = ANSI.sub('', buf.decode('utf8', 'ignore'))
                m = parse_qr(txt[txt.rfind('Scan the QR code'):])
                if len(m) > 30:
                    png(f'{OUT}/qr{attempt}.png', m); qr_done = True
                    log(f'QR {attempt} ready')
            if 'Login Success' in txt:
                logged_in = True
                break
        try:
            if os.waitpid(pid, os.WNOHANG)[0]:
                break
        except ChildProcessError:
            break
    txt = ANSI.sub('', buf.decode('utf8', 'ignore'))
    logged_in = logged_in or 'Login Success' in txt
    try:
        os.kill(pid, 9)
    except Exception:
        pass
    log(f'login attempt {attempt} ok={logged_in}')
    if logged_in:
        break
if not logged_in:
    finish(False, 'login: no one scanned the QR in time')

# ── 2. deploy ────────────────────────────────────────────────────────────────
answers = [b'\r', b'\r', (b'\x1b[B\r' if STATUS == 'testing' else b'\r'), NOTE.encode() + b'\r']
pid, fd = spawn(['deploy'])
buf, seen, last, end = b'', 0, time.time(), time.time() + 360
while time.time() < end:
    r, _, _ = select.select([fd], [], [], 1)
    if r:
        try:
            d = os.read(fd, 4096)
        except OSError:
            break
        if not d:
            break
        buf += d; last = time.time()
    txt = ANSI.sub('', buf.decode('utf8', 'ignore'))
    if time.time() - last > 2 and seen < len(answers) and re.search(r'\?\s.*$|›|❯', txt[-400:]) and txt.count('?') > seen:
        os.write(fd, answers[seen]); seen += 1; last = time.time()
    try:
        if os.waitpid(pid, os.WNOHANG)[0]:
            break
    except ChildProcessError:
        break
txt = ANSI.sub('', buf.decode('utf8', 'ignore'))
open(f'{OUT}/deploy_log.txt', 'w').write(txt[-4000:])
m = re.findall(r'\bz(?:dev|test)-[0-9a-f]+', txt)
if m:
    finish(True, f'version={m[-1]} status={STATUS}')
# Testing uploads print no zdev-/ztest- id; zmp still reports the quota after a successful upload.
if 'Deploy Quota' in txt and not re.search(r'(?i)\berror\b|failed', txt):
    finish(True, f'status={STATUS} (see Danh sách phiên bản) — ' + re.sub(r'\s+', ' ', txt[-600:]))
finish(False, 'deploy: no version id in output — ' + re.sub(r'\s+', ' ', txt[-300:]))
