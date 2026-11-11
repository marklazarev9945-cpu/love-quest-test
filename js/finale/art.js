'use strict';

const FINALE_ENDING_ART = `
<svg viewBox="0 0 640 390" role="img" aria-label="За открытой дверью Марк встречает Катю, рядом сидит Микаэлла">
  <defs>
    <linearGradient id="finale-wall" x2="0" y2="1"><stop stop-color="#f6ead5"/><stop offset="1" stop-color="#dfc2a1"/></linearGradient>
    <linearGradient id="finale-light" x2="0" y2="1"><stop stop-color="#f8e6bc"/><stop offset="1" stop-color="#cdb49a"/></linearGradient>
    <radialGradient id="finale-glow"><stop stop-color="#fff4cf" stop-opacity=".85"/><stop offset="1" stop-color="#fff4cf" stop-opacity="0"/></radialGradient>
  </defs>
  <path fill="url(#finale-wall)" d="M0 0h640v313H0z"/>
  <path fill="#d1ad8d" d="M0 313h640v77H0z"/>
  <path d="M0 334h640M0 367h640M112 314l-42 76m123-76-30 76m112-76-7 76m78-76 14 76m57-76 41 76m42-76 64 76" stroke="#a88a71" opacity=".38"/>
  <path d="M0 308h640" stroke="#ad9071" stroke-width="8"/>
  <path d="M205 314V134a115 115 0 0 1 230 0v180z" fill="url(#finale-light)" stroke="#a78364" stroke-width="10"/>
  <path d="M254 167v-51a67 67 0 0 1 134 0v51z" fill="#b5cbb8" stroke="#bc9e7d" stroke-width="5"/>
  <path d="M321 52v115m-65-45h130" stroke="#d8bb95" stroke-width="4"/>
  <circle cx="349" cy="91" r="12" fill="#f9e7b5"/>
  <path d="M255 148q39-23 73-4t58-4v24H255z" fill="#9eaf93"/>
  <path d="M212 279h216v34H212z" fill="#c5a587"/>
  <path d="m213 313 215 0 103 77H111Z" fill="#ffe9be" opacity=".23"/>
  <ellipse cx="323" cy="347" rx="177" ry="30" fill="#9aab91"/>
  <ellipse cx="323" cy="347" rx="160" ry="20" fill="none" stroke="#dcd4af" stroke-width="2" stroke-dasharray="4 6"/>
  <path d="M29 268h116v37H29z" fill="#af8c70" stroke="#98795e" stroke-width="2"/>
  <path d="M35 270h104m-92 34v23m80-23v23" stroke="#947558" stroke-width="5" stroke-linecap="round"/>
  <ellipse cx="89" cy="266" rx="23" ry="5" fill="#a18a66"/>
  <path d="M89 265v-56" stroke="#907e5e" stroke-width="4"/>
  <path d="m63 213 15-37h22l15 37z" fill="#a8b591" stroke="#859678" stroke-width="2"/>
  <ellipse cx="104" cy="214" rx="91" ry="80" fill="url(#finale-glow)"/>
  <path d="M491 278h64l-8 35h-49z" fill="#bc8f75"/>
  <path d="M522 280q-8-35-26-53m26 53q14-41 33-46m-33 46q-4-46 2-58" fill="none" stroke="#849877" stroke-width="3"/>
  <path d="M510 256q-24-2-24-27 21 5 24 27m23 2q0-22 24-26-3 22-24 26m-10-17q-16-19-2-35 13 17 2 35" fill="#a1b18e"/>
  <!-- Mark waits inside the room. -->
  <g class="finale-mark">
    <ellipse cx="360" cy="321" rx="28" ry="6" fill="#7a785f" opacity=".22"/>
    <path d="m348 275-3 42m25-42 4 42" stroke="#d4c9b6" stroke-width="13" stroke-linecap="round"/>
    <path d="m350 286-2 26m24-26 3 26" stroke="#e5dac5" stroke-width="2" stroke-linecap="round"/>
    <path d="M339 320h15m15 0h14" stroke="#f1e6d3" stroke-width="7" stroke-linecap="round"/>
    <path d="m342 238-12 27m48-27 12 24" stroke="#d9cdbb" stroke-width="11" stroke-linecap="round"/>
    <path d="M330 269h.1m60-3h.1" stroke="#eac09f" stroke-width="9" stroke-linecap="round"/>
    <path d="M340 231q20-9 40 0l5 52h-51z" fill="#e4dac8" stroke="#bba992" stroke-width="1.4"/>
    <path d="M348 225q12-11 24 0l4 10-16 11-16-11z" fill="#e9e0d1" stroke="#c5b49d" stroke-width="1.5"/>
    <path d="m342 231 13 12-2 39h-19zm36 0-13 12 2 39h18z" fill="#d9cdbb"/>
    <path d="m347 227 11 13-13-2-7-5zm26 0-11 13 13-2 7-5z" fill="#f0e6d5" stroke="#c5b49d" stroke-width="1.2"/>
    <path d="M338 249h13v12h-13zm31 0h13v12h-13z" fill="#e7dcc9" stroke="#bba992" stroke-width="1.2"/>
    <path d="M338 250h13m18 0h13m-24-9 1 14m4-14-1 14" stroke="#b19d86" stroke-width="1.2" stroke-linecap="round"/>
    <ellipse cx="360" cy="212" rx="17" ry="20" fill="#ebc4a3"/>
    <path d="M343 214q-6-16 3-23l5-6q14-2 22 5 8 7 5 22l-5-12q-9 4-17-2l-7 5-3 11z" fill="#7d6d59"/>
    <path d="M348 194q9-7 20-1m-17-3q7-5 15-1" stroke="#a19179" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <path d="M353 213h.1m13 0h.1" stroke="#65554b" stroke-width="3" stroke-linecap="round"/>
    <path d="M354 221q6 6 12 0" fill="none" stroke="#a87b66" stroke-width="2" stroke-linecap="round"/>
    <path d="M376 220v3" stroke="#f2e7d4" stroke-width="2.2" stroke-linecap="round"/>
  </g>
  <g class="finale-door" fill="#b79373" stroke="#987658" stroke-width="4">
    <path d="M204 314V134a114 114 0 0 1 229 0v180Z"/>
    <path d="M221 297V134a97 97 0 0 1 195 0v163z" fill="none" stroke="#d0af8e"/>
    <path d="M236 160h166v65H236zm0 79h166v42H236z" fill="#ac8568" stroke="#cca98b"/>
    <circle cx="397" cy="231" r="7" fill="#e5c185" stroke="#9d7a56"/>
  </g>
  <!-- Katya approaches Mark; her palette follows the town sprite. -->
  <g class="finale-katya">
    <ellipse cx="302" cy="337" rx="28" ry="6" fill="#6d7861" opacity=".2"/>
    <path d="M282 224q-4-29 20-29 25 0 24 30l3 40h-51z" fill="#a58b68"/>
    <path d="m293 289-2 43m22-43 1 43" stroke="#809bae" stroke-width="10" stroke-linecap="round"/>
    <path d="M285 335h13m11 0h13" stroke="#eee4d3" stroke-width="7" stroke-linecap="round"/>
    <path d="M282 246q21-13 40 0l6 48h-49z" fill="#a17c68"/>
    <path d="m286 250-10 26m43-26 11 20" stroke="#927362" stroke-width="8" stroke-linecap="round"/>
    <path d="M276 279h.1m55-6h.1" stroke="#edc7a1" stroke-width="8" stroke-linecap="round"/>
    <ellipse cx="304" cy="226" rx="15" ry="19" fill="#edc7a1"/>
    <path d="M284 226q-2-30 19-30 20 0 19 27l-9-13-7-4-17 20z" fill="#ad9673"/>
    <path d="M288 214q-6 17-3 39m33-40q7 18 4 39" stroke="#c5ab84" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M299 226h.1m11 0h.1" stroke="#635746" stroke-width="3" stroke-linecap="round"/>
    <path d="M299 234q6 5 11 0" fill="none" stroke="#bc8d76" stroke-width="2" stroke-linecap="round"/>
  </g>
  <g class="finale-cat">
    <ellipse cx="410" cy="340" rx="27" ry="5" fill="#7f8d76" opacity=".25"/>
    <path d="M422 332q23 4 20-14" stroke="#a6aaa2" stroke-width="7" fill="none" stroke-linecap="round"/>
    <ellipse cx="409" cy="325" rx="18" ry="15" fill="#b8bdb5"/>
    <path d="m392 319-2-16 12 6 9-1 10-7 2 17" fill="#a8afa6"/>
    <ellipse cx="407" cy="316" rx="16" ry="11" fill="#c9cdc4"/>
    <path d="M400 316h.1m12 0h.1m-7 4 2 1" stroke="#68766a" stroke-width="2" stroke-linecap="round"/>
  </g>
</svg>`;
