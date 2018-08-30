'use strict'

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *
 *
 *   APP COMPONENTS
 *
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

const ActorRoleLabelTemplate = (props) => {
  return $(`
<div class="actors-panel__role-label">
  ${props.label}
</div>`)}

const ActorTemplate = (props) => {
  const accusedVariant = props.accused
    ? 'actor-thumb_accused'
    : null
  const name = props.name
  return $(`
<button
  class="actor-thumb ${accusedVariant}">
  <div class="actor-thumb__picture"></div>
  <div class="actor-thumb__hover-name-wrapper">
    <div class="actor-thumb__hover-name">${name}</div>
  </div>
</button>`)}

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *
 *
 *   REQUEST DATA
 *
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

$.ajax({
  method: 'GET',
  url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQiKKlxaKWpKKQIPM5JwMU1JDKCWwtEDTG7CgU-5jmTgWhlB3BVyzJb5TbmNoplKJ668Xnm809JLa1j/pub?gid=2063391218&single=true&output=tsv'
}).then(res => { init(res) })
  .catch(err => { console.log(err) })

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *
 *
 *   FILL TEMPLATE WITH DATA & SET INTERACTIONS
 *
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

function init (rawData) {
  const data = parse(rawData)
  
  const categorizedActors = {}
  data.actors.forEach(actor => {
    const role = actor.role
      .toLowerCase()
      .replace(/[^a-z0-9-]/igm, '-')
      .replace(/-{2,}/igm, '-')
      .replace(/-$/, '')
      .replace(/-/igm, '_')
    if (!categorizedActors[role]) categorizedActors[role] = []
    categorizedActors[role].push(actor)
  })

  if (categorizedActors.accus_e.length) {
    ActorRoleLabelTemplate({
      label: `L'accusé`
    }).appendTo('.actors-panel__actors-list')
    categorizedActors.accus_e.forEach(actor => {
      ActorTemplate({
        accused: true,
        name: actor.name
      }).appendTo('.actors-panel__actors-list')
    })
  }

  if (categorizedActors.plaignant_e.length) {
    ActorRoleLabelTemplate({
      label: `Les plaignantes`
    }).appendTo('.actors-panel__actors-list')
    categorizedActors.plaignant_e.forEach(actor => {
      ActorTemplate({
        name: actor.name
      }).appendTo('.actors-panel__actors-list')
    })
  }

  if (categorizedActors.temoin.length) {
    ActorRoleLabelTemplate({
      label: `Les témoins`
    }).appendTo('.actors-panel__actors-list')
    categorizedActors.temoin.forEach(actor => {
      ActorTemplate({
        name: actor.name
      }).appendTo('.actors-panel__actors-list')
    })
  }
}

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *
 *
 *   OTHER FUNCTIONS
 *
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

function parse (rawData) {
  const rawLines = rawData.split(/\n/)
  const cells = rawLines.map(line => line.split(/\t/))
  const actorsTable = []
  const factsTable = []
  cells.forEach((line, i) => {
    actorsTable.push(line.slice(0, 5))
    factsTable.push(line.slice(5))
  })
  const actors = table2object(actorsTable)
  const facts = table2object(factsTable)

  return { actors, facts }
  
  function table2object (table) {
    return table.map((line, i) => {
      if (i < 3) return
      if (!line.join('')) return
      const object = {}
      line.forEach((elt, j) => {
        const key = table[1][j]
        object[key] = elt
      })
      return object
    }).filter(elt => elt)
  }
}
