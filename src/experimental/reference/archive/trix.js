// a simple TriX game player
const inflate = x => compute(`2 * ${x}`)
const deflate = x => compute(`(2 * ${x} - 1)/3`)
recurse = n => {
    let T = new Set(`1`)
    Array.seq( k => k , 1, n).forEach( () => {
      let S = [...T]
      S.forEach( s => {
        T.add(inflate(s))
        if (compute(`check(mod(${s},3)=2)`)==='1') T.add(deflate(s))
      })
    })
    return T
}