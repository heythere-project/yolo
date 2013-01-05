exports.test1 = function (test) {
   test.equal("foo", "foo", "should be the same");
   test.notEqual("foo", "bar", "never the same");
   test.done();
}