const { test } = require("tap");
const concatStream = require("concat-stream");

const resumeStream = require("../resume-stream");

test("resume stream implicit resumes", assert => {
  const stream = resumeStream();

  assert.plan(1);

  stream.queue("here I am\n");
  stream.queue(null);

  stream.pipe(concatStream(data => assert.equal(data, "here I am\n")));
});

test("pause and resume stream", assert => {
  const stream = resumeStream();
  let paused = true;

  assert.plan(2);

  stream.queue("here I am\n");
  stream.queue(null);
  stream.pause();

  setTimeout(() => {
    paused = false;
    stream.resume();
  }, 100);

  stream.pipe(
    concatStream(data => {
      assert.equal(paused, false);
      assert.equal(data, "here I am\n");
    })
  );
});
