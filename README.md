# Rak Sadness

Simple auto-scoring application for [Rak Madness](https://rakmadness.net/). This is the TypeScript/React port of the simple JavaScript/Express API [here](https://github.com/crombach/rak-sadness).

Uses [the hidden ESPN API](https://gist.github.com/akeaswaran/b48b02f1c94f873c6655e7129910fc3b) to fetch game results, and consumes the weekly Rak Madness spreadsheet to do auto-scoring.
Spreadsheets provided by Rak will likely cleanup before they can be parsed, at least until we get Rak to standardize his team abbreviations to the ESPN ones.

Here is a [spreadsheet for team abbreviations](https://docs.google.com/spreadsheets/d/1qPdaaXTtnA33izapArCRN--BTNYb-Q0GwhhycJ4dx3w/edit?usp=drivesdk) in both the NFL and NCAA.
