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
 *   APPLICATION STATE SETTER
 *
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

const state = {}
function setState (key, val) {
  switch (key) {
    case 'activeBio':
      activateBio(val)
      break
    case 'actorFilter':
      console.log('set actor filter on val: ', val)
      activateFilter(val)
      break
    default:
  }
  state[key] = val
}

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *
 *
 *   FILL TEMPLATE WITH DATA & SET INTERACTIONS
 *
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

function init (rawData) {
  moment.locale('fr')
  const { actors, facts } = parse(rawData)

  populateTemplate(actors, facts)
  setState('activeBio', null)
  setState('actorFilter', null)
  setInteractions()
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
  const accusedVariant = props.role === 'Accusé•e' ? 'actor-thumb_accused' : ''
  const smallVariant = props.small ? 'actor-thumb_small' : ''
  const noLabelVariant = props.noLabel ? 'actor-thumb_no-label' : ''
  const openBioVariant = parseInt(props.id, 10) === 1 ? 'actor-thumb_bio-open' : ''
  return $(`
<div
  data-id="${props.id}"
  class="actor-thumb ${accusedVariant} ${smallVariant} ${noLabelVariant} ${openBioVariant}">
  <div class="actor-thumb__picture"></div>
  <div class="actor-thumb__hover-name-wrapper">
    <div class="actor-thumb__hover-name">${props.name}</div>
  </div>
  ${(!smallVariant && ! props.noBio)
    ? `<div class="actor-thumb__bio">
      <div class="actor-thumb__bio-name">${props.name}</div>
      <button class="actor-thumb__bio-close"></button>
      <div class="actor-thumb__bio-content">${props.bio || 'Aucune bio.'}</div>
      <button class="actor-thumb__filter-facts">Filtrer</button>
    </div>`
    : ''
  }
</div>`)}

/* -------------------- Bios panel bio -------------------- */
function BiosPanelBioTemplate (props) {
  return $(
`<div class="bios-panel__bio" data-id="${props.id}">
  <div class="bios-panel__bio-name">${props.name}</div>
  <div class="bios-panel__bio-content">${props.bio || 'Aucune bio.'}</div>
  <button class="bios-panel__filter-facts">Filtrer</button>
</div>`)}

/* -------------------- Facts year label -------------------- */
function FactsYearLabelTemplate (props) {
  return $(`
<h3 class="facts-panel__year">
  ${props.year}
</h3>`)}

/* -------------------- Fact -------------------- */
function FactTemplate (props) {
  const relatedActorsDom = props.relatedActors
    .map(rel => ActorThumbTemplate(
        Object.assign({}, rel, { small: true })
      )
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

function populateTemplate (actors, facts) {
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
      ActorThumbTemplate(Object.assign({}, actor, {
        noBio: true,
        noLabel: true
      })).appendTo('.bios-panel__actors-list')
      BiosPanelBioTemplate(actor)
        .appendTo('.bios-panel')
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
      ActorThumbTemplate(Object.assign({}, actor, {
        noBio: true,
        noLabel: true
      })).appendTo('.bios-panel__actors-list')
      BiosPanelBioTemplate(actor)
        .appendTo('.bios-panel')
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
      ActorThumbTemplate(Object.assign({}, actor, {
        noBio: true,
        noLabel: true
      })).appendTo('.bios-panel__actors-list')
      BiosPanelBioTemplate(actor)
        .appendTo('.bios-panel')
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

function activateBio (id) {
  $('.actor-thumb_bio-open').removeClass('actor-thumb_bio-open')
  if (id === null) {
    $('.page-content__bios_visible').removeClass('page-content__bios_visible')
    return
  }
  if (parseInt(id)) {
    if (state.activeBio === null) $('.page-content__bios').addClass('page-content__bios_visible')
    $(`.actor-thumb[data-id="${id}"]`).addClass('actor-thumb_bio-open')
    $('.bios-panel__bio_visible').removeClass('bios-panel__bio_visible')
    $(`.bios-panel__bio[data-id="${id}"`).addClass('bios-panel__bio_visible')
    const itemWidth = $(`.bios-panel__actors-list .actor-thumb[data-id="${id}"]`).width()
    const itemOffset = $(`.bios-panel__actors-list .actor-thumb[data-id="${id}"]`).offset().left
    const listWidth = $('.bios-panel__actors-list').width()
    const listOffset = $('.bios-panel__actors-list').offset().left
    const listScroll = $('.bios-panel__actors-list').scrollLeft()
    const targetOffset = listOffset + listWidth / 2 - itemWidth / 2
    const offsetDiff = targetOffset - itemOffset
    const targetScroll = listScroll - offsetDiff
    $('.bios-panel__actors-list').animate({ scrollLeft: targetScroll }, 400)
    return
  }
}

function activateFilter (id) {
  console.log('activate filter')
}

function setInteractions () {
  $('.actor-thumb').on('click', function (e) {
    e.preventDefault()
    if ($(e.target).hasClass('actor-thumb__picture')) {
      const actorId = $(this).data('id')
      setState('activeBio', actorId)
    }
  })
  $('.bios-panel__close').on('click', function (e) {
    e.preventDefault()
    setState('activeBio', null)
  })
  $('.actor-thumb__bio-close').on('click', function (e) {
    e.preventDefault()
    setState('activeBio', null)
  })
  $('.actor-thumb__filter-facts').on('click', function (e) {
    e.preventDefault()
    const actorId = $(this).parents('.actor-thumb').data('id')
    setState('actorFilter', actorId)
  })
  $('.bios-panel__filter-facts').on('click', function (e) {
    e.preventDefault()
    const actorId = $(this).parents('.bios-panel__bio').data('id')
    setState('actorFilter', actorId)
  })
}
