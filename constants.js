/*jslint node: true */
/*jshint esversion: 6 */
"use strict";

let ParserPart = Object.freeze({
    Title: 0,
    Description: 1,
    Url: 2,
});
let MessagePart = Object.freeze({
    Title: 0,
    Coords: 1,
    Time: 2,
});

module.exports = {
    MessagePart: MessagePart,
    ParserPart: ParserPart
};