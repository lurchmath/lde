// Raw Example Data for the LurchMath Parser

const syntax = 
[

'Logic',
[['P and Q', 'P∧Q'                   ],`P\\text{ and }Q`],
[['P or Q',  'P∨Q'                   ],`P\\text{ or }Q`],
[['not P', '¬P'                      ],`\\neg P`],
[['P implies Q', 'P⇒Q'               ],`P\\Rightarrow Q`],
[['P iff Q', 'P⇔Q'                   ],`P\\Leftrightarrow Q`],
[['contradiction', '→←'              ],`\\rightarrow\\leftarrow`],

'Quantifiers and bindings',
[['forall ', 'for all ', '∀'         ],'\\forall' ],
[['exists ', '∃'                     ],'\\exists' ],
[['exists unique ', '∃!'             ],'\\exists!' ],
[['forall x.x&lt;x+1',
  'for all x.x&lt;x+1', 
  '∀x.x&lt;x+1'                      ],`\\forall x, x&lt;x+1` ],
[['exists x.x=2 cdot x', 
  '∃x.x=2⋅x'                         ],`\\exists x, x=2x` ],
[['x.x+2', 'x↦x+2'                   ],`x, x+1`],

'Algebraic expressions',
[['(x)'                              ],'\\left(x\\right)'],
[['x+y'                              ],`x+y`],
[['2+x+y'                            ],`2+x+y`],
[['-x'                               ],`-x` ],
[['1-x'                              ],`1-x`],
[['x cdot y', 'x⋅y'                  ],`x\\cdot y`],
[['2 cdot x cdot y', '2⋅x⋅y'         ],`2\\cdot x\\cdot y`],
[['1/x'                              ],`1/x`],
[['x^2'                              ],`x^2`],
[['x factorial', 'x！'               ],`x!`],

'Set Theory',
[['x in A', 'x∈A'                    ],`x\\in A` ],
[['x notin A', 'x∉A'                 ],`x\\notin A` ],
[['A subset B', 'A subseteq B', 'A⊆B'],`A\\subseteq B`],
[['A cup B', 'A union B', 'A∪B'      ],`A\\cup B`],
[['A cap B', 'A intersect B', 'A∩B'  ],`A\\cap B`],
[['A setminus B', 'A∖B'              ],`A\\setminus B`],
[['A complement', 'A°'               ],`A^\\circ`],
[['f:A→B'                            ],`f\\colon A\\to B`],
[['f(x)'                             ],`f\\left(x\\right)`],
[['g circ f', 'g∘f'                  ],`g\\circ f`],
[['A times B', 'A×B'                 ],`A\\times B`],
[['⟨x,y⟩'                            ],'\\langle x,y \\rangle'],

'Relations',
[['x &lt; 0', 'x lt 0'               ],`x&lt;0` ],
[['x leq 0', 'x ≤ 0'                 ],`x\\leq 0` ],
[['x neq 0', 'x ne 0', 'x≠0'         ],`x\\neq 0` ],
[['m | n', 'm divides n'             ],`m\\mid n` ],
[['a≈b mod m'                        ],`a\\underset{m}{\\equiv}b` ],
[['x~y'                              ],`x\\sim y`],
[['x~y~z'                            ],`x\\sim y\\sim z`],
[['x=y'                              ],`x=y`],
[['x=y=z'                            ],`x=y=z`],
[['X loves Y'                        ],`X\\text{ loves }Y`],
[['X is Y', 'X is an Y', 'X is a Y'  ],`X\\text{ is }Y`],
[['P is a partition of A'            ],`P\\text{ is a partition of }A`],
[[`'~' is an equivalence relation`   ],`\\sim\\text{ is equivalence relation}`],
[['[a]'                              ],`\\left[a\\right]` ],
[['[a,~]'                            ],`\\left[a\\right]_{\\sim}` ],
[[`'~' is a strict partial order`    ],`\\sim\\text{ is strict partial order}`],
[[`'~' is a partial order`           ],`\\sim\\text{ is partial order}`],
[[`'~' is a total order`             ],`\\sim\\text{ is total order}`],

'Assumptions and Declarations',
[['Assume P', 'Given P', 
  'Suppose P', 'If P', ':P'          ],`\\text{Assume }P` ],
[['Let x'                            ],`\\text{Let }x` ],
[['Let x be such that x in ℝ',
  'Let x such that x in ℝ'           ],
  `\\text{Let }x\\text{ be such that }x\\in\\mathbb{R}` ],
[['f(c)=0 for some c'                ],`f(c)=0\\text{ for some }c` ],

'Miscellaneous',
[['f⁻(x)', 'f recip(x)', 'f inv(x)'  ],`f^-\\left(x\\right)`],
[['x recip', 'x inv', 'x⁻'           ],`x^-`],
[['λP(k)'                            ],`\\lambda{P}(k)` ],

] 
export const makedoc = () => {
  let ans = ''
  syntax.forEach( row => {
    if (typeof row === 'string') {
      ans = ans + 
        `<tr><td colspan="2" class="subheader">${row}</td></tr>\n`
    } else {
      ans = ans + 
        `<tr><td>${row[0].join('<br/>')}</td><td>$${row[1]}$</td></tr>\n`
    }
  })
  let doc = loadStr('lurch-parser-docs-template','./parsers/','html')
              .replace(/## MAKEDOC OUTPUT GOES HERE ##/g,ans)
  fs.writeFileSync('./parsers/lurch-parser-docs.html', doc)
}