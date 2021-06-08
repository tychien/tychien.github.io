console.log = function() {};
const assert = require('chai').assert;
const fs = require('fs');
const Structured = require('structured');

const code = fs.readFileSync('public/main.js', 'utf8');

describe('', function () {
  it('', function() {
    let structureOne = function() {
      const getSuggestions = () => {
        xhr.onreadystatechange = () => {
          if (xhr.readyState === XMLHttpRequest.DONE) {
            renderResponse(xhr.response)
          }
        }
      }
    };

    let isMatchOne = Structured.match(code, structureOne);
    assert.isOk(isMatchOne, 'Did you delete `renderRawResponse` and replace it with `renderResponse`?')
  });
});
