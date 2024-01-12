///////////////////////////////////////////////////////////////////////////
// TeX to LurchMath Parser
//

export const latexToLurch = (input) =>
{ 
  return input.replace(/Rightarrow/g, 'implies')
              .replace(/Leftrightarrow/g, 'iff')
              .replace(/mid/g, 'divides')
              .replace(/sim/g, '~')
              .replace(/!/g, ' factorial')
              .replace(/lambda/g, '𝜆')
              .replace(/\\rightarrow\\leftarrow/g, ' contradiction ')
              .replace(/\\left([({[]])/g, '$1')
              .replace(/\\right([)}]]])/g, '$1')
              .replace(/\\mathrm{([^}]*)}/g, ' $1 ' )
              .replace(/\\text{([^}]*)}/g, ' $1 ' )
              .replace(/[{}]/g, ' ' )
              .replace(/\\/g, ' ' )
}
