"""Copy sim.js (SIM-START..SIM-END) into index.html's inline script. usage: python3 tools/sync-sim.py"""
h = open('index.html').read(); s = open('sim.js').read()
code = s[s.index('// SIM-START'):s.index('// SIM-END')]
i = h.index('// SIM-START'); j = h.index('</script>', i)
open('index.html', 'w').write(h[:i] + code.rstrip('\n') + '\n\n' + h[j:])
print('sim synced:', code.count('\n'), 'lines')
