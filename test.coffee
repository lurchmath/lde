
class Test
    @classMember : -> 5
    callClassMember : -> Test.classMember()

test = new Test()

console.log test.callClassMember()

