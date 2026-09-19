# -*- coding: utf-8 -*-
"""מרכיב את project-hub.html מתוך התבנית ורכיבי המקור."""
import io, os
H = os.path.dirname(os.path.abspath(__file__))
R = lambda n: io.open(os.path.join(H, n), encoding='utf-8').read()

src = R('hub_shell.html')
cad = R('cad_from_svg.js').split('if(typeof module')[0]
parts = {
    '/*__CAD__*/': cad,
    '/*__SURVEY__*/': R('hub_survey.js'),
    '/*__OUT__*/': R('hub_out.js'),
    '/*__HUB__*/': R('hub_core.js') + '\n' + R('hub_build.js'),
}
for k, v in parts.items():
    assert k in src, k
    src = src.replace(k, v, 1)

io.open(os.path.join(H, 'project-hub.html'), 'w', encoding='utf-8').write(src)
print('project-hub.html', len(src), 'chars')
