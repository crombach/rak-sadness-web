# Rak Sadness

Simple auto-scoring web application for [Rak Madness](https://rakmadness.net/). The [public site](https://rak.cullenrombach.com/) is hosted on CloudFlare Pages.

Results are viewable on the web and can be exported to an XLSX spreadsheet.

Uses [the hidden ESPN API](https://gist.github.com/akeaswaran/b48b02f1c94f873c6655e7129910fc3b) to fetch game results, and consumes the weekly Rak Madness spreadsheet to do auto-scoring.
Spreadsheets provided by Rak may require some cleanup before they can be parsed, though an effort has been made to standardize on the ESPN team abbreviations.

Here is a [spreadsheet for team abbreviations](https://docs.google.com/spreadsheets/d/1qPdaaXTtnA33izapArCRN--BTNYb-Q0GwhhycJ4dx3w/edit?usp=drivesdk) in both the NFL and NCAA.
Here is a link to [the Google Drive folder containing historical picks and scores spreadsheets](https://drive.google.com/drive/folders/1oHVWKoAbDtT2vJLU3yBP9ofEOPEzNrqi?usp=sharing).

This was thrown together using KISS principles for a small, family-and-friends football pool. It is not intended for public (or at-scale) use and, as such, should not be judged too harshly.
