'use strict'

moment.locale('fr')

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
    case 'actors':
      populateTemplate(val, state.facts || [])
      break
    case 'facts':
      populateTemplate(state.actors || [], val)
      break
    case 'activeBio':
      activateBio(val)
      break
    case 'actorFilter':
      activateFilter(val)
      break
    default:
  }
  const pState = JSON.parse(JSON.stringify(state))
  state[key] = val
  // console.log('\n\n============================')
  // console.log(moment().format('YYYY/MM/DD, HH:mm:ss:SS'))
  // console.log('Set', key)
  // console.log('To', val)
  // console.log('----------------------------')
  // console.log({pState, state})
}

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
}).then(res => {
  const { actors, facts } = parse(res)
  setState('actors', actors)
  setState('facts', facts)
  setState('activeBio', null)
  setState('actorFilter', null)
  setState('bioTouch', {
    active: false,
    start: { x: undefined, y: undefined },
    pPos: { x: undefined, y: undefined },
    pos: { x: undefined, y: undefined }
  })
}).catch(err => console.log(err))
// [WIP] Gérer la phase de chargement des données
// [WIP] Gérer la possiblité d'une erreur de chargement
// [WIP] Set interval in order to get the height of the menu and adjust sticky elements offset
// [WIP] Store actors and facts inside state

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
  class="fact-spacer"
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
        if (key === 'id') object[key] = parseInt(elt, 10) || undefined
        else object[key] = elt
      })
      return object
    }).filter(elt => elt)
  }
}

function emptyActorsPanel () {
  $('.actors-panel__role-label').remove()
  $('.actors-panel .actor-thumb').remove()
}

function emptyFactsPanel () {
  $('.facts-panel__year').remove()
  $('.facts-panel .fact').remove()
  $('.fact-spacer').remove()
}

function emptyBiosPanel () {
  $('.bios-panel .actor-thumb').remove()
  $('.bios-panel__bio').remove()
}

function emptyTemplate () {
  emptyActorsPanel()
  emptyFactsPanel()
  emptyBiosPanel()
}

function populateFactsPanel (actors, facts) {
  /* Empty facts panel */
  emptyFactsPanel()

  /* Sort the facts */
  const sortedFacts = facts.sort((a, b) => {
    const timestamp = date => moment(date, 'DD/MM/YYYY').format('x')
    return timestamp(a.date) - timestamp(b.date)
  })

  /* Add the facts */
  const actorsArray = (actors => {
    const ret = []
    actors.forEach(actor => { ret[actor.id] = actor })
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
    const marginBottom = calcMargin(daysDiff)
    const relatedActors = fact.related_actors_id
      .split(';')
      .map(id => parseInt(id, 10) || undefined)
      .filter(e => e)
      .map(id => actorsArray[id])
    if (date.year() - pDate.year()) {
      $('.facts-panel__end-margin')
        .before(
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

  /* Set event listeners */
  setInteractions()
}

function populateBiosPanel (actors, facts) {
  /* Empty bios panel */
  emptyBiosPanel()

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
    categorizedActors.accus_e.forEach(actor => {
      BiosPanelBioTemplate(actor)
        .appendTo('.bios-panel')
      ActorThumbTemplate(Object.assign({}, actor, {
        noBio: true,
        noLabel: true
      })).appendTo('.bios-panel__actors-list')
    })
  }

  /* Add the complainants */
  if (
    categorizedActors.plaignant_e &&
    categorizedActors.plaignant_e.length) {
    categorizedActors.plaignant_e.forEach(actor => {
      BiosPanelBioTemplate(actor)
        .appendTo('.bios-panel')
      ActorThumbTemplate(Object.assign({}, actor, {
        noBio: true,
        noLabel: true
      })).appendTo('.bios-panel__actors-list')
    })
  }

  /* Add the witnesses */
  if (
    categorizedActors.temoin &&
    categorizedActors.temoin.length) {
    categorizedActors.temoin.forEach(actor => {
      BiosPanelBioTemplate(actor)
        .appendTo('.bios-panel')
      ActorThumbTemplate(Object.assign({}, actor, {
        noBio: true,
        noLabel: true
      })).appendTo('.bios-panel__actors-list')
    })
  }

  /* Set event listeners */
  setInteractions()
}

function populateActorsPanel (actors, facts) {
  /* Empty actors panel */
  emptyActorsPanel()

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

  /* Set event listeners */
  setInteractions()
}

function populateTemplate (actors, facts) {
  /* Empty template */
  emptyTemplate()

  /* Populate app panels */
  populateActorsPanel(actors, facts)
  populateBiosPanel(actors, facts)
  populateFactsPanel(actors, facts)

  /* Set event listeners */
  setInteractions()
}

function activateBio (id) {
  // If already active, do nothing, STOP HERE
  if (id === state.activeBio) return
  // Close opened bio in actors panel (desktop)
  $('.actor-thumb_bio-open')
    .removeClass('actor-thumb_bio-open')
  // If 'null' to activate, hide bios panel (mobile), STOP HERE
  if (id === null) {
    $('.page-content__bios_visible')
      .removeClass('page-content__bios_visible')
  }
  /* [WIP] do this better
  if (id === null) {
    $('.page-content__bios_visible')
      .animate({ opacity: 0 }, 400, e => {
        $('.page-content__bios_visible')
          .removeClass('page-content__bios_visible')
          .attr('style', '')
      })
    return 
  }
  */

  // Open the bios on the right actor thumbs
  $(`.actor-thumb[data-id="${id}"]`)
    .addClass('actor-thumb_bio-open')

  /* [WIP] do this better
  // Stop all animations and remove style attributes added by jQuery animations
  $('.bios-panel__bio').stop().css({
    opacity: '',
    height: ''
  })
  */

  if (state.activeBio === null) {
    $('.page-content__bios')
      .addClass('page-content__bios_visible')
  }
  /* [WIP] do this better
  // If no bio is currently active, show the bios panel (mobile) 
  if (state.activeBio === null) {
    $('.page-content__bios')
      .addClass('page-content__bios_visible')
      .css({ opacity: 0 })
      .animate({ opacity: 1 }, 400, e => {
        $('.page-content__bios')
          .attr('style', '')
      })
  }
  */

  const prevPanel = $('.bios-panel__bio_visible').removeClass('bios-panel__bio_visible')
  const newPanel = $(`.bios-panel__bio[data-id="${id}"`).addClass('bios-panel__bio_visible')
  /* [WIP] do this better
  // Re-arrange bios order in bios panel (mobile) (so that they appear above the prev one)
  const newOrder = []
  $('.bios-panel__bio').each((i, elt) => {
    if ($(elt).data('id') !== id) newOrder.push(elt)
  })
  newOrder.unshift($(`.bios-panel__bio[data-id="${id}"`))
  $('.bios-panel__bio').detach()
  newOrder.forEach(elt => $('.bios-panel').append(elt))

  // Animate previous bio and next bio in bios panel (mobile)
  const prevPanel = $('.bios-panel__bio_visible')
  const newPanel = $(`.bios-panel__bio[data-id="${id}"`)
  if (prevPanel.length) {
    prevPanel.animate({ opacity: 0 }, 400, e => {
      prevPanel.animate({ height: 0 }, 400, e => {
        prevPanel
          .removeClass('bios-panel__bio_visible')
          .attr('style', '')
      })
      newPanel
        .addClass('bios-panel__bio_visible')
        .hide()
        .slideDown(400, e => newPanel.attr('style', ''))
    })
  } else {
    newPanel
      .hide()
      .slideDown(400, e => newPanel.addClass('bios-panel__bio_visible').attr('style', ''))
  }
  */

  /* [WIP] do it better
  // Center actor thumbs list in bios panel (mobile)
  const bioPan = {}
  bioPan.itemWidth = $(`.bios-panel__actors-list .actor-thumb[data-id="${id}"]`).width(),
  bioPan.itemOffset = $(`.bios-panel__actors-list .actor-thumb[data-id="${id}"]`).offset().left,
  bioPan.listWidth = $('.bios-panel__actors-list').width(),
  bioPan.listOffset = $('.bios-panel__actors-list').offset().left,
  bioPan.listScroll = $('.bios-panel__actors-list').scrollLeft(),
  bioPan.targetOffset = bioPan.listOffset + bioPan.listWidth / 2 - bioPan.itemWidth / 2,
  bioPan.offsetDiff = bioPan.targetOffset - bioPan.itemOffset,
  bioPan.targetScroll = bioPan.listScroll - bioPan.offsetDiff
  $('.bios-panel__actors-list').animate({ scrollLeft: bioPan.targetScroll }, 400)
  // Center actor thumbs list in actors-list (mobile)
  const actPan = {}
  actPan.itemWidth = $(`.actors-panel__actors-list .actor-thumb[data-id="${id}"]`).width(),
  actPan.itemOffset = $(`.actors-panel__actors-list .actor-thumb[data-id="${id}"]`).offset().left,
  actPan.listWidth = $('.actors-panel__actors-list').width(),
  actPan.listOffset = $('.actors-panel__actors-list').offset().left,
  actPan.listScroll = $('.actors-panel__actors-list').scrollLeft(),
  actPan.targetOffset = actPan.listOffset + actPan.listWidth / 2 - actPan.itemWidth / 2,
  actPan.offsetDiff = actPan.targetOffset - actPan.itemOffset,
  actPan.targetScroll = actPan.listScroll - actPan.offsetDiff
  $('.actors-panel__actors-list').animate({ scrollLeft: actPan.targetScroll }, 400)
  */
}

function activateFilter (id) {
  // If already active, do nothing, STOP HERE
  if (id === state.actorFilter) return
  // If 'null' to activate, hide filter panel, STOP HERE
  if (id === null) {
    populateFactsPanel(state.actors, state.facts)
    $('.facts-panel__filter-value').html('')
    $('.facts-panel__filter-panel').css({
      opacity: 0,
      zIndex: -1000
    })
    return
  }
  // Find actor by it's ID
  const actor = state.actors.find(actor => actor.id === id)
  const actorName = actor ? actor.name : undefined
  // Find the facts related to the actor
  const actorFacts = state.facts.filter(fact => {
    const isRelatedToActor = fact.related_actors_id
      .split(';')
      .some(relId => parseInt(relId, 10) === id)
    return isRelatedToActor
  })
  // Update dom
  $('.facts-panel__filter-value').html(actorName)
  $('.facts-panel__filter-panel').attr('style', '')
  populateFactsPanel(state.actors, actorFacts)
}

function setInteractions () {
  // Open bio on actor thumb click
  $('.actor-thumb')
    .unbind()
    .on('click', function (e) {
      e.preventDefault()
      if ($(e.target).hasClass('actor-thumb__picture')) {
        const actorId = $(this).data('id')
        setState('activeBio', actorId)
      }
    })

  /* [WIP] do it better
  // Switch active bios on bios panel swipe
  $('.bios-panel__bio')
    .unbind()
    
  $('.bios-panel__bio')
    .on('touchstart', function (e) {
      const x = e.originalEvent.touches[0].screenX
      const y = e.originalEvent.touches[0].screenY
      setState('bioTouch', Object.assign({}, state.bioTouch, {
        active: true,
        start: { x, y },
        pPos: { x: undefined, y: undefined },
        pos: { x, y }
      }))
    })

  $('.bios-panel__bio')
    .on('touchmove', function (e) {
      const x = e.originalEvent.touches[0].screenX
      const y = e.originalEvent.touches[0].screenY
      const pX = state.bioTouch.pos.x
      const pY = state.bioTouch.pos.y
      const sX = state.bioTouch.start.x
      const sY = state.bioTouch.start.y
      const deltaX = x - sX
      const deltaY = y - sY
      setState('bioTouch', Object.assign({}, state.bioTouch, {
        pPos: { x: pX, y: pY },
        pos: { x, y }
      }))
      const containerWidth = $('.bios-panel').width()
      const offsetOnWidth = Math.abs(deltaX) / containerWidth
      const transform = `translate(${deltaX}px)`
      const opacity = 1 - offsetOnWidth
      $('.bios-panel__bio_visible').css({ transform, opacity })
    })

  $('.bios-panel__bio')
    .on('touchend', function (e) {
      const sX = state.bioTouch.start.x
      const sY = state.bioTouch.start.y
      const x = state.bioTouch.pos.x
      const y = state.bioTouch.pos.y
      const diffX = x - sX
      setState('bioTouch', Object.assign({}, state.bioTouch, {
        active: false,
        start: { x: undefined, y: undefined },
        pPos: { x, y },
        pos: { x: undefined, y: undefined }
      }))
      if (diffX < -80) {
        if (state.activeBio >= state.actors.length) {
          setState('activeBio', 1)
        } else {
          setState('activeBio', state.activeBio + 1)
        }
        return
      }
      if (diffX > 80) {
        if (state.activeBio <= 1) {
          setState('activeBio', state.actors.length)
        } else {
          setState('activeBio', state.activeBio - 1)
        }
        return
      }
      replaceElt($('.bios-panel__bio_visible'))
      function replaceElt (element) {
        const transformRegexp = /transform: translate\(-?[0-9]*(.[0-9]*)?px\);/
        const translateVal = parseFloat(
          element.attr('style')
            .match(transformRegexp)[0]
            .split(/transform: translate\(/)[1]
            .split(/px\);/)[0],
          10
        )
        const newTranslate = translateVal / 2
        const containerWidth = $('.bios-panel').width()
        const offsetOnWidth = newTranslate / containerWidth
        const transform = `translate(${newTranslate}px)`
        const opacity = 1 - offsetOnWidth
        if (Math.abs(translateVal) > 1) {
          if (!state.bioTouch.active) {
            element.css({ transform, opacity })
            setTimeout(() => replaceElt(element), 20)
          }
        } else {
          element.attr('style', '')
        }
      }
    })
  */
  // Close bio on bios panel close button click
  $('.bios-panel__close')
    .unbind()
    .on('click', function (e) {
      e.preventDefault()
      setState('activeBio', null)
    })
  // Close bio on bios panel background click
  $('.page-content__bios')
    .unbind()
    .on('click', function (e) {
      e.preventDefault()
      if ($(e.target).hasClass('page-content__bios')) {
        setState('activeBio', null)
      }
    })
  // Close bios on floating bios close button click
  $('.actor-thumb__bio-close')
    .unbind()
    .on('click', function (e) {
      e.preventDefault()
      setState('activeBio', null)
    })
  // Set actor filter on floating bio filter button click
  $('.actor-thumb__filter-facts')
    .unbind()
    .on('click', function (e) {
      e.preventDefault()
      const actorId = $(this).parents('.actor-thumb').data('id')
      setState('actorFilter', actorId)
      setState('activeBio', null)
    })
  // Set actor filter on bios panel filter button click
  $('.bios-panel__filter-facts')
    .unbind()
    .on('click', function (e) {
      e.preventDefault()
      const actorId = $(this).parents('.bios-panel__bio').data('id')
      setState('actorFilter', actorId)
      setState('activeBio', null)
    })
  // Reset actor filter on filter panel reset button click
  $('.facts-panel__filter-close')
    .unbind()
    .on('click', function (e) {
      setState('actorFilter', null)
    })
}
