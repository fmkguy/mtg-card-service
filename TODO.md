
## Maintenance
- [ ] migrate to using a build/transpile step (it'd be nice if backend AND frontend could take advantage of ES6 module syntax)

## Goals
- [ ] need endpoint that returns simplified/distinct cards to improve search UX when you're just looking for card data (instead of trying to add a specific print to your collection)
  - [ ] Run more tests around performance to determine the impacts of trimming documents
  - [ ] Need data around sending entire collection response (response size could be too large)
- [ ] endpoints for import/export (transforms simple card data => uuids or uuids => simple card data) (MTGA format?)
- [x] add prices collection to track card/deck/collection values

## Frontend
- [ ] ??