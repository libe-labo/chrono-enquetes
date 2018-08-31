'use strict'

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
}).then(res => init(res))
  .catch(err => console.log(err))
// [WIP] Gérer la phase de chargement des données
// [WIP] Gérer la possiblité d'une erreur de chargement

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *
 *
 *   FILL TEMPLATE WITH DATA & SET INTERACTIONS
 *
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

function init (rawData) {
  const { actors, facts } = parse(rawData)
  moment.locale('fr')

  /* Sort actors bu role */
  const categorizedActors = {}
  actors.forEach(actor => {
    const role = actor.role
      .toLowerCase()
      .replace(/[^a-z0-9-]/igm, '-')
      .replace(/-{2,}/igm, '-')
      .replace(/-$/, '')
      .replace(/-/igm, '_')
    if (!categorizedActors[role]) categorizedActors[role] = []
    categorizedActors[role].push(actor)
  })

  /* Add the accused */
  if (
    categorizedActors.accus_e &&
    categorizedActors.accus_e.length) {
    ActorRoleLabelTemplate({
      label: `L'accusé`
    }).appendTo('.actors-panel__actors-list')
    categorizedActors.accus_e.forEach(actor => {
      ActorThumbTemplate(actor)
        .appendTo('.actors-panel__actors-list')
    })
  }

  /* Add the complainants */
  if (
    categorizedActors.plaignant_e &&
    categorizedActors.plaignant_e.length) {
    ActorRoleLabelTemplate({
      label: `Les plaignantes`
    }).appendTo('.actors-panel__actors-list')
    categorizedActors.plaignant_e.forEach(actor => {
      ActorThumbTemplate(actor)
        .appendTo('.actors-panel__actors-list')
    })
  }

  /* Add the witnesses */
  if (
    categorizedActors.temoin &&
    categorizedActors.temoin.length) {
    ActorRoleLabelTemplate({
      label: `Les témoins`
    }).appendTo('.actors-panel__actors-list')
    categorizedActors.temoin.forEach(actor => {
      ActorThumbTemplate(actor)
        .appendTo('.actors-panel__actors-list')
    })
  }

  /* Sort the facts */
  const sortedFacts = facts.sort((a, b) => {
    const timestamp = date => moment(date, 'DD/MM/YYYY').format('x')
    return timestamp(a.date) - timestamp(b.date)
  })

  /* Add the facts */
  const calcMargin = days => {
    const u = 10
    const [a, b, c, d, e] = [7, 30, 365, 3650, 36500]
    const [f, g, h, i] = [(b - a), (c - b), (d - c), (e - d)]
    if (days < 0) return 0
    if (days < a) return u * days
    if (days < b) return (u * a) + (days - a) * u/a
    if (days < c) return (u * a) + (f * u/a) + (days - b) * u/b
    if (days < d) return (u * a) + (f * u/a) + (g * u/b) + (days - c) * u/c
    if (days < e) return (u * a) + (f * u/a) + (g * u/b) + (h * u/c) + (days - d) * u/d
    if (days >= e) return (u * a) + (f * u/a) + (g * u/b) + (h * u/c) + (i * u/d)
  }
  const actorsArray = (actors => {
    const ret = []
    actors.forEach(actor => {
      ret[actor.id] = actor
    })
    return ret
  })(actors)
  sortedFacts.forEach((fact, i) => {
    const date = moment(fact.date, 'DD/MM/YYYY')
    const pDate = i > 0
      ? moment(sortedFacts[i - 1].date, 'DD/MM/YYYY')
      : moment('01/01/0', 'DD/MM/YYYY')
    const nDate = i < sortedFacts.length - 1
      ? moment(sortedFacts[i + 1].date, 'DD/MM/YYYY')
      : date
    const title = fact.title
    const content = fact.html_text
    const diff = nDate.format('x') - date.format('x')
    const daysDiff = diff / 86400000
    const marginBottom = calcMargin(daysDiff)
    const relatedActors = fact.related_actors_id
      .split(';')
      .map(id => parseInt(id, 10) || undefined)
      .filter(e => e)
      .map(id => actorsArray[id])
    if (date.year() - pDate.year()) {
      $('.facts-panel__end-margin').before(
        FactsYearLabelTemplate({
          year: date.year()
        })
      )
    }
    $('.facts-panel__end-margin').before(
      FactTemplate({
        title,
        content,
        relatedActors,
        date: date.format('Do MMMM')
      })
    )
    $('.facts-panel__end-margin').before(
      FactSpacerTemplate({
        marginBottom
      })
    )
  })
}

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *
 *
 *   APP COMPONENTS
 *
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

/* -------------------- Actor role label -------------------- */
function ActorRoleLabelTemplate (props) {
  return $(`
<div class="actors-panel__role-label">
  ${props.label}
</div>`)}

/* -------------------- Actor thumb -------------------- */
function ActorThumbTemplate (props) {
  const accusedVariant = props.role === 'Accusé•e' ? 'actor-thumb_accused' : null
  const smallVariant = props.small ? 'actor-thumb_small' : null
  const name = props.name
  const id = props.id
  return $(`
<button
  data-id="${id}"
  class="actor-thumb ${accusedVariant} ${smallVariant}">
  <div class="actor-thumb__picture"></div>
  <div class="actor-thumb__hover-name-wrapper">
    <div class="actor-thumb__hover-name">${name}</div>
  </div>
</button>`)}

/* -------------------- Actor bio -------------------- */
function ActorBioTemplate (props) {

}

/* -------------------- Facts year label -------------------- */
function FactsYearLabelTemplate (props) {
  return $(`
<h3 class="facts-panel__year">
  ${props.year}
</h3>`)}

/* -------------------- Fact -------------------- */
function FactTemplate (props) {
  const relatedActorsDom = props.relatedActors.map(rel => ActorThumbTemplate(
    Object.assign(
      {}, rel, {
        small: true
      }
    ))
  )
  return $(`
<div class="fact">
  <h4 class="fact__date">${props.date}</h4>
  <div class="fact__title">${props.title || '!! sans-titre !!'}</div>
  <div class="fact__card">
    <div class="fact__content">
      ${props.content}
    </div>
    <div class="fact__actors">
      ${relatedActorsDom
        .map(rel => rel[0].outerHTML)
        .reverse()
        .join('')}
    </div>
  </div>
</div>`)}

/* -------------------- Fact spacer -------------------- */
function FactSpacerTemplate (props) {
  return $(`
<div
  class="fact__spacer"
  style="height: ${props.marginBottom}px">
</div>`)}

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *
 *
 *   OTHER FUNCTIONS
 *
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

function parse (rawData) {
  const rawLines = rawData.split(/\n/)
  const cells = rawLines.map(line => line.replace(/\r$/, '').split(/\t/))
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


// facts.push({
//   id: '22',
//   date: '1/1/2200',
//   title: 'In a far away past',
//   html_text: 'Texte'
// }, {
//   id: '23',
//   date: '2/1/2200',
//   title: 'In a far away past',
//   html_text: 'Texte'
// }, {
//   id: '24',
//   date: '4/1/2200',
//   title: 'In a far away past',
//   html_text: 'Texte'
// }, {
//   id: '23',
//   date: '7/1/2200',
//   title: 'In a far away past',
//   html_text: 'Texte'
// }, {
//   id: '23',
//   date: '13/1/2200',
//   title: 'In a far away past',
//   html_text: 'Texte'
// }, {
//   id: '23',
//   date: '18/1/2200',
//   title: 'In a far away past',
//   html_text: 'Texte'
// }, {
//   id: '23',
//   date: '24/1/2200',
//   title: 'In a far away past',
//   html_text: 'Texte'
// }, {
//   id: '23',
//   date: '31/1/2200',
//   title: 'In a far away past',
//   html_text: 'Texte'
// }, {
//   id: '23',
//   date: '7/2/2200',
//   title: 'In a far away past',
//   html_text: 'Texte'
// }, {
//   id: '23',
//   date: '14/2/2200',
//   title: 'In a far away past',
//   html_text: 'Texte'
// }, {
//   id: '23',
//   date: '21/2/2200',
//   title: 'In a far away past',
//   html_text: 'Texte'
// }, {
//   id: '23',
//   date: '28/2/2200',
//   title: 'In a far away past',
//   html_text: 'Texte'
// }, {
//   id: '23',
//   date: '1/4/2200',
//   title: 'In a far away past',
//   html_text: 'Texte'
// }, {
//   id: '23',
//   date: '1/6/2200',
//   title: 'In a far away past',
//   html_text: 'Texte'
// }, {
//   id: '23',
//   date: '1/9/2200',
//   title: 'In a far away past',
//   html_text: 'Texte'
// }, {
//   id: '23',
//   date: '1/1/2201',
//   title: 'In a far away past',
//   html_text: 'Texte'
// }, {
//   id: '23',
//   date: '1/6/2201',
//   title: 'In a far away past',
//   html_text: 'Texte'
// }, {
//   id: '23',
//   date: '1/12/2201',
//   title: 'In a far away past',
//   html_text: 'Texte'
// }, {
//   id: '23',
//   date: '1/7/2202',
//   title: 'In a far away past',
//   html_text: 'Texte'
// }, {
//   id: '23',
//   date: '1/3/2203',
//   title: 'In a far away past',
//   html_text: 'Texte'
// }, {
//   id: '23',
//   date: '1/12/2203',
//   title: 'In a far away past',
//   html_text: 'Texte'
// }, {
//   id: '23',
//   date: '1/10/2204',
//   title: 'In a far away past',
//   html_text: 'Texte'
// }, {
//   id: '23',
//   date: '1/9/2205',
//   title: 'In a far away past',
//   html_text: 'Texte'
// }, {
//   id: '23',
//   date: '1/9/2206',
//   title: 'In a far away past',
//   html_text: 'Texte'
// }, {
//   id: '23',
//   date: '1/9/2207',
//   title: 'In a far away past',
//   html_text: 'Texte'
// }, {
//   id: '23',
//   date: '1/9/2209',
//   title: 'In a far away past',
//   html_text: 'Texte'
// }, {
//   id: '23',
//   date: '1/9/2212',
//   title: 'In a far away past',
//   html_text: 'Texte'
// }, {
//   id: '23',
//   date: '1/9/2216',
//   title: 'In a far away past',
//   html_text: 'Texte'
// }, {
//   id: '23',
//   date: '1/9/2221',
//   title: 'In a far away past',
//   html_text: 'Texte'
// }, {
//   id: '23',
//   date: '1/9/2227',
//   title: 'In a far away past',
//   html_text: 'Texte'
// }, {
//   id: '23',
//   date: '1/9/2235',
//   title: 'In a far away past',
//   html_text: 'Texte'
// }, {
//   id: '23',
//   date: '1/9/2244',
//   title: 'In a far away past',
//   html_text: 'Texte'
// }, {
//   id: '23',
//   date: '1/9/2254',
//   title: 'In a far away past',
//   html_text: 'Texte'
// }, {
//   id: '23',
//   date: '1/9/2264',
//   title: 'In a far away past',
//   html_text: 'Texte'
// }, {
//   id: '23',
//   date: '1/9/2284',
//   title: 'In a far away past',
//   html_text: 'Texte'
// }, {
//   id: '23',
//   date: '1/9/2314',
//   title: 'In a far away past',
//   html_text: 'Texte'
// }, {
//   id: '23',
//   date: '1/9/2354',
//   title: 'In a far away past',
//   html_text: 'Texte'
// }, {
//   id: '23',
//   date: '1/9/2404',
//   title: 'In a far away past',
//   html_text: 'Texte'
// }, {
//   id: '23',
//   date: '1/9/2464',
//   title: 'In a far away past',
//   html_text: 'Texte'
// }, {
//   id: '23',
//   date: '1/9/2534',
//   title: 'In a far away past',
//   html_text: 'Texte'
// }, {
//   id: '23',
//   date: '1/9/2614',
//   title: 'In a far away past',
//   html_text: 'Texte'
// }, {
//   id: '23',
//   date: '1/9/2704',
//   title: 'In a far away past',
//   html_text: 'Texte'
// }, {
//   id: '23',
//   date: '1/9/2804',
//   title: 'In a far away past',
//   html_text: 'Texte'
// })
