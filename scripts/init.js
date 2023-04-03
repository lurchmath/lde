////////////////////////////////////////////////////////////////////////////
// WARNING: putting let or const in front of a definition will cause it to 
// be local to the init file and not expored to the Lode global.  Don't use
// const or let for things you want to export.
////////////////////////////////////////////////////////////////////////////

// Sample documents and libs to load at startup so there is something to play with.
// You can customize this to be whatever you like locally.

LurchLib = ['Prop','Pred','Peano','Number Theory']
LurchThmLib = ['Prop','PropThm','Pred','PredThm','Peano','Number Theory']

propdoc = load('propdoc','Prop')
preddoc = load('preddoc',['Prop','Pred'])
thmdoc  = load('thm2',LurchLib)

// don't echo anything
undefined
///////////////////////////////////////////////////////////