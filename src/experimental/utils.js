/**
 * Generic javascript utilities.
 * 
 * @module Utilities
 */

/**
 * Find the longest common initial slice of a set of arrays.
 * 
 * @function
 * @param  {...Array} arrays - The arrays to compare.
 * @returns {Array} - The longest common initial slice of the arrays.
 */
const commonInitialSlice = (...arg) => {
  if (!arg.length) return
  let k=0; while (arg.every( A => A[k] === arg[0][k] && k<arg[0].length )) k++
  return arg[0].slice(0,k)
}

/**
 * Checks a filename to see if it has the right extension and adds the extension
 * if it doesn't. The default extension is 'js'.
 * 
 * @function
 * @param {string} name - The filename to check.
 * @param {string} [ext='js'] - The extension to add if missing.
 * @returns {string} - The filename with the correct extension.
 */
const checkExtension = ( name , ext = 'js' ) => 
  ( name.endsWith(`.${ext}$`)) ? name : name + '.' + ext 

/**
 * Return a string of $n$ spaces (or other character). 
 * 
 * @function
 * @param {number} n - the length of the string
 * @param {string} [char=' '] - the character to use
 * @returns {string} the resulting string
 */
const tab = (n , char=' ') => { return Array.seq(()=>'',1,n+1).join(char) }

/**
 * Indent string $s$ with a tab of $n$ spaces. If $s$ contains multiple lines,
 * indent each line.
 *
 * @function
 * @param {string} s - the string to indent
 * @param {number} n - the number of spaces to indent
 * @returns {string} the resulting string   
 */ 
const indent = (s,n) => {
  const t = tab(n)
  return t+s.replaceAll(/\n(.)/g,'\n'+t+'$1')
}    

// make a right justified line number consisting of a minimum width padded on
// the right with a given suffix

/**
 * Returns a right justified line number consisting of a minimum width padded on
 * the right with a given suffix.
 * 
 * @function
 * @param {number} n - The line number.
 * @param {number} [width=4] - The minimum width of the line number.
 * @param {string} [suffix=': '] - The suffix to be added to the line number.
 * @returns {string} The right justified line number.
 */
const lineNum = (n,width=4,suffix=': ') => { 
    const num = String(n)
    return String(n).padStart(width-num.length-1, ' ')+suffix
}

// The string of unicode numerical subscripts, '₀₁₂₃₄₅₆₇₈₉'. 
const subscriptDigits = '₀₁₂₃₄₅₆₇₈₉'

/**
 * Convert the integer $n$ to a string consisting of the corresponding unicode
 * subscript.
 * 
 * @function
 * @param {number} n - The integer to be converted.
 */
const subscript = n => [...n.toString()].map(d => subscriptDigits[d]).join('')

/** 
 * Report the time it took to execute function `f`, passed as an argument. 
 */
const timer = (f,msg='') => {
  let start = Date.now()
  f()
  console.log(`${msg} ${(Date.now()-start)} ms`)
}

export default {
  commonInitialSlice, checkExtension, tab, indent, lineNum, subscript, timer
}