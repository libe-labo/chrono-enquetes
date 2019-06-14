'use strict'

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *
 *
 *   INIT APP
 *
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

/* Define state and state setter */
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
      updateFactsScrollLevels()
      break
    case 'timesAndOffsets':
      moveTimelineCursors(null, val)
      break
    case 'loading':
      toggleLoadingState(val)
      break
    default:
  }
  state[key] = val
}

/*
 * No need to call setState('loading', true) since DOM
 * comes at first with #wrapper.wrapper.wrapper_loading node
 */

/* Set moment locale to fr */
moment.locale('fr')

/* Watch window size and scroll offset in order to adjust timeline size */
$(window).on('resize', e => setTimeout(() => {
  resizeTimelinePanel()
  updateFactsScrollLevels()
  moveTimelineCursors()
}, 10))
setInterval(() => {
  resizeTimelinePanel()
  updateFactsScrollLevels()
  moveTimelineCursors()
}, 2000)

/* Request data */
function requestData () {
  setState('loading', true)
  $.ajax({
    method: 'GET',
    url: customData.dataUrl
  }).then(res => {
    const { actors, facts } = parse(res)
    setState('loading', false)
    setState('actors', actors)
    setState('facts', facts)
    setState('activeBio', null)
    setState('actorFilter', null)
  }).catch(err => {
    setTimeout(window.location.reload, 2000)
  })
}
requestData()


/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *
 *
 *   APP COMPONENTS
 *
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

/* -------------------- Share article module --------------------*/
/* Facebook share */
$('.share-article__facebook').on('click', function (e) {
  const articleUrl = $('meta[property="og:url"]').attr('content')
  const facebookUrl = 'https://www.facebook.com/sharer/sharer.php?u=' + articleUrl
  const features = 'width=575,height=400,menubar=no,toolbar=no'
  window.open(facebookUrl, '', features)
})
/* Twitter share */
$('.share-article__twitter').on('click', function (e) {
  const features = 'width=575,height=400,menubar=no,toolbar=no'
  const txt = $('meta[name="custom:tweet-text"]').attr('content')
  const url = $('meta[name="twitter:url"]').attr('content')
  const via = $('meta[name="custom:tweet-via"]').attr('content')
  const tweet = `${txt} ${url} via ${via}`
  const twitterUrl = `https://twitter.com/intent/tweet?original_referer=&text=${tweet}`
  window.open(twitterUrl, '', features)
})
/* Send article via mail */
$('.share-article__mail').on('click', function (e) {
  if ($(e.target).prop('tagName') === 'A') return
  const articleTitle = $('meta[property="og:title"').attr('content')
  const articleDescription = $('meta[property="og:description"]').attr('content')
  const articleUrl = $('meta[property="og:url"]').attr('content')
  const mailSubject = 'Lu sur Libération.fr'
  const mailBody = articleTitle +
    '%0D%0A%0D%0A' +
    articleDescription +
    '%0D%0A%0D%0A' +
    'Retrouvez cet article sur le site de Libération :' +
    '%0D%0A' +
    articleUrl
  const href = `mailto:?subject=${mailSubject}&body=${mailBody}`
  $('<a>click</a>')
    .attr('href', href)
    .appendTo(this)
  this.querySelector('a').click()
  $(this).find('a').remove()
})
/* Print article */
$('.share-article__print').on('click', function (e) { window.print() })

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
  // [WIP] Wrote the line below for the "Affaire ramadan", and now, can't understand why
  // const openBioVariant = parseInt(props.id, 10) === 1 ? 'actor-thumb_bio-open' : ''
  const openBioVariant = props.openBio ? 'actor-thumb_bio-open' : ''
  const image = props.image_url || ''
  const imageStyle = image ? `background-image: url('${image}');` : ''
  const idLetter = props.id_letter
  return $(`
<div
  data-id="${props.id}"
  class="actor-thumb ${accusedVariant} ${smallVariant} ${noLabelVariant} ${openBioVariant}">
  <div
    class="actor-thumb__picture"
    style="${imageStyle}">
      <div class="actor-thumb__id-letter">${idLetter}</div>
    </div>
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
  const relatedActorsDom = props.related_actors
    .map(rel => ActorThumbTemplate(
        Object.assign({}, rel, { small: true })
      )
    )
  const date = props.display_date || (props.date.year() === moment().year()
    ? props.date.format('Do MMMM')
    : props.date.format('Do MMMM YYYY'))
  const classes = ['fact']
  if (parseInt(props.importance, 10)) classes.push('fact_important')
  return $(`
<div
  class="${classes.join(' ')}"
  data-id="${props.id}"
  data-timestamp="${props.date.valueOf()}">
  <h4 class="fact__date">${date}</h4>
  <div class="fact__title">${props.title || '!! sans-titre !!'}</div>
  <div class="fact__card">
    <div class="fact__content">
      ${props.html_text}
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
    actorsTable.push(line.slice(0, 7))
    factsTable.push(line.slice(7))
  })
  const actors = table2object(actorsTable)
  const facts = table2object(factsTable)
  return {
    actors,
    facts
  }
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

function toggleLoadingState (val) {
  if (val) $('.wrapper').addClass('wrapper_loading')
  else $('.wrapper_loading').removeClass('wrapper_loading')
}

/* -------------------- Facts panel -------------------- */

function emptyFactsPanel () {
  $('.facts-panel__year').remove()
  $('.facts-panel .fact').remove()
  $('.fact-spacer').remove()
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
        id: fact.id,
        date,
        display_date: fact.display_date,
        importance: fact.importance,
        type: fact.type,
        title: fact.title,
        html_text: fact.html_text,
        related_actors: relatedActors
      })
    )
    // [WIP] Removed the non-linear spacing between facts
    // const nDate = i < sortedFacts.length - 1
    //   ? moment(sortedFacts[i + 1].date, 'DD/MM/YYYY')
    //   : date
    // const diff = nDate.format('x') - date.format('x')
    // const daysDiff = diff / 86400000
    // const marginBottom = (days => {
    //   const u = 10
    //   const [a, b, c, d, e] = [7, 30, 365, 3650, 36500]
    //   const [f, g, h, i] = [(b - a), (c - b), (d - c), (e - d)]
    //   if (days < 0) return 0
    //   if (days < a) return u * days
    //   if (days < b) return (u * a) + (days - a) * u/a
    //   if (days < c) return (u * a) + (f * u/a) + (days - b) * u/b
    //   if (days < d) return (u * a) + (f * u/a) + (g * u/b) + (days - c) * u/c
    //   if (days < e) return (u * a) + (f * u/a) + (g * u/b) + (h * u/c) + (days - d) * u/d
    //   if (days >= e) return (u * a) + (f * u/a) + (g * u/b) + (h * u/c) + (i * u/d)
    // })(daysDiff)
    // $('.facts-panel__end-margin').before(
    //   FactSpacerTemplate({
    //     marginBottom
    //   })
    // )
  })
  /* Set event listeners */
  setInteractions()
}

/* -------------------- Bios panel -------------------- */

function emptyBiosPanel () {
  $('.bios-panel .actor-thumb').remove()
  $('.bios-panel__bio').remove()
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
  /* Add the du genre homo */
  if (
    categorizedActors.du_genre_homo &&
    categorizedActors.du_genre_homo.length) {
    categorizedActors.du_genre_homo.forEach(actor => {
      BiosPanelBioTemplate(actor)
        .appendTo('.bios-panel')
      ActorThumbTemplate(Object.assign({}, actor, {
        noBio: true,
        noLabel: true
      })).appendTo('.bios-panel__actors-list')
    })
  }
  /* Add the australopitheques */
  if (
    categorizedActors.australopith_ques &&
    categorizedActors.australopith_ques.length) {
    categorizedActors.australopith_ques.forEach(actor => {
      BiosPanelBioTemplate(actor)
        .appendTo('.bios-panel')
      ActorThumbTemplate(Object.assign({}, actor, {
        noBio: true,
        noLabel: true
      })).appendTo('.bios-panel__actors-list')
    })
  }
  /* Add the others */
  if (
    categorizedActors.autres &&
    categorizedActors.autres.length) {
    categorizedActors.autres.forEach(actor => {
      BiosPanelBioTemplate(actor)
        .appendTo('.bios-panel')
      ActorThumbTemplate(Object.assign({}, actor, {
        noBio: true,
        noLabel: true
      })).appendTo('.bios-panel__actors-list')
    })
  }
  /* Add the associates */
  if (
    categorizedActors.les_plus_anciens_hominines &&
    categorizedActors.les_plus_anciens_hominines.length) {
    categorizedActors.les_plus_anciens_hominines.forEach(actor => {
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

/* -------------------- Actors panel -------------------- */

function emptyActorsPanel () {
  $('.actors-panel__role-label').remove()
  $('.actors-panel .actor-thumb').remove()
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
  /* Add the du genre homo */
  if (
    categorizedActors.du_genre_homo &&
    categorizedActors.du_genre_homo.length) {
    ActorRoleLabelTemplate({
      label: customData.rolesLabels.homo
    }).appendTo('.actors-panel__actors-list')
    categorizedActors.du_genre_homo.forEach(actor => {
      ActorThumbTemplate(actor)
        .appendTo('.actors-panel__actors-list')
    })
  }
  /* Add the australopitheques */
  if (
    categorizedActors.australopith_ques &&
    categorizedActors.australopith_ques.length) {
    ActorRoleLabelTemplate({
      label: customData.rolesLabels.australo
    }).appendTo('.actors-panel__actors-list')
    categorizedActors.australopith_ques.forEach(actor => {
      ActorThumbTemplate(actor)
        .appendTo('.actors-panel__actors-list')
    })
  }
  /* Add autres */
  if (
    categorizedActors.autres &&
    categorizedActors.autres.length) {
    ActorRoleLabelTemplate({
      label: customData.rolesLabels.other
    }).appendTo('.actors-panel__actors-list')
    categorizedActors.autres.forEach(actor => {
      ActorThumbTemplate(actor)
        .appendTo('.actors-panel__actors-list')
    })
  }
  /* Add les plus anciens hominines */
  if (
    categorizedActors.les_plus_anciens_hominines &&
    categorizedActors.les_plus_anciens_hominines.length) {
    ActorRoleLabelTemplate({
      label: customData.rolesLabels.hominines
    }).appendTo('.actors-panel__actors-list')
    categorizedActors.les_plus_anciens_hominines.forEach(actor => {
      ActorThumbTemplate(actor)
        .appendTo('.actors-panel__actors-list')
    })
  }
  /* Set event listeners */
  setInteractions()
}

/* -------------------- Timeline panel -------------------- */

function resizeTimelinePanel () {
  const $window = $(window)
  const $timeline = $('.timeline-panel')
  if ($window.width() > 920) {
    const $navigation = $('div[role="navigation"] .header-fix-nav')
    const $header = $('.header_desktop')
    const $pageContentTimeline = $('.page-content__timeline')
    const windowHeight = $window.outerHeight()
    const navHeight = $navigation.outerHeight()
    const headerHeight = $header.outerHeight()
    const panelPaddingTop = parseInt(
      $pageContentTimeline
        .css('paddingTop')
        .split('px')[0]
      , 10
    )
    const panelPaddingBottom = parseInt(
      $pageContentTimeline
        .css('paddingBottom')
        .split('px')[0]
      , 10
    )
    const timelineHeight = windowHeight
      - navHeight
      - headerHeight
      - panelPaddingTop
      - panelPaddingBottom
    $timeline.css({ height: timelineHeight })
    return
  }
  $timeline.css({ height: '' })
}

function populateTimeline (facts) {
  const sortedFacts = [...facts].sort((a, b) => {
    const dateA = moment(a.date, 'DD/MM/YYYY').valueOf()
    const dateB = moment(b.date, 'DD/MM/YYYY').valueOf()
    return dateA - dateB
  })
  const beginDate = sortedFacts[0] 
    ? moment(sortedFacts[0].date, 'DD/MM/YYYY')
    : moment('01/01/01', 'DD/MM/YYYY')
  const endDate = sortedFacts[sortedFacts.length - 1]
    ? moment(sortedFacts[sortedFacts.length - 1].date, 'DD/MM/YYYY')
    : moment('01/01/01', 'DD/MM/YYYY')
  const beginYear = beginDate.year()
  const endYear = endDate.year()
  $('.timeline-panel__begin-date').show()
  $('.timeline-panel__end-date').show()
  if (beginYear !== endYear) {
    $('.timeline-panel__begin-date').html(beginYear)
    $('.timeline-panel__end-date').html(endYear)
  } else {
    $('.timeline-panel__begin-date').html(beginYear)
    $('.timeline-panel__end-date').html('').hide()
  }
  sortedFacts.forEach(fact => {
    const factDate = moment(fact.date, 'DD/MM/YYYY').valueOf()
    const factReadableDate = moment(fact.date, 'DD/MM/YYYY').format('Do MMM YY')
    const datePosition = (factDate - beginDate) / (endDate - beginDate)
    const desktopStyle = `top: ${datePosition * 100}%;`
    const mobileStyle = `left: ${datePosition * 100}%;`
    const classes = ['timeline-panel__event']
    if (fact.importance) classes.push('timeline-panel__event_important')
    if (fact.type === 'Déclenchement') classes.push('timeline-panel__event_start')
    if (fact.type === 'Procès') classes.push('timeline-panel__event_trial')
    const dom = $(`
      <div
        data-id="${fact.id}"
        data-timestamp="${fact.timestamp}"
        class="${[...classes, 'timeline-panel__event_desktop'].join(' ')}"
        style="${desktopStyle}">
        <div class="timeline-panel__event-hover">
          <div class="timeline-panel__event-hover-date">${factReadableDate}</div>
          <div class="timeline-panel__event-hover-title">${fact.title || 'Sans titre'}</div>
        </div>
      </div>
      <div
        data-id="${fact.id}"
        data-timestamp="${factDate}"
        class="${[...classes, 'timeline-panel__event_mobile'].join(' ')}"
        style="${mobileStyle}">
        <div class="timeline-panel__event-hover">
          <div class="timeline-panel__event-hover-date">${factReadableDate}</div>
          <div class="timeline-panel__event-hover-title">${fact.title || 'Sans titre'}</div>
        </div>
      </div>`
    )
    dom.appendTo('.timeline-panel__events')
  })
  // [WIP] removed the years increments in timeline
  // let yearsIncrement = 1 
  // if (endYear - beginYear > 6) yearsIncrement = 2
  // if (endYear - beginYear > 12) yearsIncrement = 3
  // if (endYear - beginYear > 20) yearsIncrement = 4
  // if (endYear - beginYear > 50) yearsIncrement = 5
  // if (endYear - beginYear > 100) yearsIncrement = 20
  // for (let i = beginYear + yearsIncrement; i < endYear + 1; i += yearsIncrement) {
  //   const date = moment(`01/01/${i}`, 'DD/MM/YYYY').valueOf()
  //   const datePosition = (date - beginDate) / (endDate - beginDate)
  //   const style = `top: ${datePosition * 100}%;`
  //   const dom = $(`<div class="timeline-panel__events-date" style="${style}">${i}</div>`)
  //   dom.appendTo('.timeline-panel__events')
  // }
}

/* -------------------- Full template -------------------- */

function emptyTemplate () {
  emptyActorsPanel()
  emptyFactsPanel()
  emptyBiosPanel()
}

function populateTemplate (actors, facts) {
  /* Empty template */
  emptyTemplate()
  /* Populate app panels */
  populateActorsPanel(actors, facts)
  populateBiosPanel(actors, facts)
  populateFactsPanel(actors, facts)
  populateTimeline(facts)
  /* Resize timeline panel */
  resizeTimelinePanel()
  updateFactsScrollLevels()
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
      .animate({ opacity: 0 }, 400, e => {
        $('.page-content__bios_visible')
          .removeClass('page-content__bios_visible')
          .attr('style', '')
      })
    return 
  }
  // Open the bios on the right actor thumbs
  $(`.actor-thumb[data-id="${id}"]`)
    .addClass('actor-thumb_bio-open')
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
  const prevPanel = $('.bios-panel__bio_visible').removeClass('bios-panel__bio_visible')
  const newPanel = $(`.bios-panel__bio[data-id="${id}"]`).addClass('bios-panel__bio_visible')
  // Center actor thumbs list in bios panel (mobile)
  const bioPan = {}
  bioPan.itemWidth = $(`.bios-panel__actors-list .actor-thumb[data-id="${id}"]`).width()
  bioPan.itemOffset = $(`.bios-panel__actors-list .actor-thumb[data-id="${id}"]`).offset().left
  bioPan.listWidth = $('.bios-panel__actors-list').width()
  bioPan.listOffset = $('.bios-panel__actors-list').offset().left
  bioPan.listScroll = $('.bios-panel__actors-list').scrollLeft()
  bioPan.targetOffset = bioPan.listOffset + bioPan.listWidth / 2 - bioPan.itemWidth / 2
  bioPan.offsetDiff = bioPan.targetOffset - bioPan.itemOffset
  bioPan.targetScroll = bioPan.listScroll - bioPan.offsetDiff
  $('.bios-panel__actors-list').animate({ scrollLeft: bioPan.targetScroll }, 400)
  // Center actor thumbs list in actors-list (mobile)
  const actPan = {}
  actPan.itemWidth = $(`.actors-panel__actors-list .actor-thumb[data-id="${id}"]`).width()
  actPan.itemOffset = $(`.actors-panel__actors-list .actor-thumb[data-id="${id}"]`).offset().left
  actPan.listWidth = $('.actors-panel__actors-list').width()
  actPan.listOffset = $('.actors-panel__actors-list').offset().left
  actPan.listScroll = $('.actors-panel__actors-list').scrollLeft()
  actPan.targetOffset = actPan.listOffset + actPan.listWidth / 2 - actPan.itemWidth / 2
  actPan.offsetDiff = actPan.targetOffset - actPan.itemOffset
  actPan.targetScroll = actPan.listScroll - actPan.offsetDiff
  $('.actors-panel__actors-list').animate({ scrollLeft: actPan.targetScroll }, 400)
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
  // Close floating bios on body click
  $('body')
    .unbind()
    .on('click', function (e) {
      const $target = $(e.target)
      const hasActorThumbInParents = $target.parents('.actor-thumb').length
      const isActorThumbWrapper = $target.is('.actor-thumb')
      const clickedOnActorThumb = hasActorThumbInParents || isActorThumbWrapper
      if (!clickedOnActorThumb && state.activeBio) {
        setState('activeBio', null)
      }
    })
  // Open bio on actor thumb click
  $('.actor-thumb')
    .unbind()
    .on('click', function (e) {
      e.preventDefault()
      const isBioPanel = $(e.target).hasClass('actor-thumb__bio')
      const isInBioPanel = $(e.target).parents('.actor-thumb__bio').length
      if (isBioPanel || isInBioPanel) return
      const actorId = $(this).data('id')
      setState('activeBio', actorId)
    })
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
  // Close floating bios on floating bios close button click
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
  // Watch scroll level and update timeline cursor position
  $(window)
    .unbind()
    .on('scroll', e => setTimeout(
      function () {
        moveTimelineCursors(e)
      }, 10
    ))
  // Automatically scroll when timeline is clicked
  $('.timeline-panel__begin-date')
    .unbind()
    .on('click', e => $('html, body')
      .animate({ scrollTop: 0 }, 1000))
  $('.timeline-panel__end-date')
    .unbind()
    .on('click', e => $('html, body')
      .animate({ scrollTop: $(document).height() }, 1000))
  $('.timeline-panel__event')
    .unbind()
    .on('click', function (e) {
      const id = $(this).data('id')
      scrollToFact(id)
    })
}

function updateFactsScrollLevels () {
  const timesAndOffsets = []
  const factsList = $('.facts-panel .fact')
  factsList.each((i, fact) => {
    timesAndOffsets.push({
      id: $(fact).data('id'),
      offset: $(fact).offset().top,
      height: $(fact).height(),
      timestamp: $(fact).data('timestamp')
    })
  })
  timesAndOffsets.sort((a, b) => a.offset - b.offset)
  setState('timesAndOffsets', timesAndOffsets)
}

function moveTimelineCursors (e, range = state.timesAndOffsets) {
  const windowHeight = $(window).height()
  const documentHeight = $(document).height()
  const factsPanelHeight = $('.facts-panel').height()
  const scroll = $(window).scrollTop()
  const scrollRatio = scroll / (documentHeight - windowHeight)
  const compScrollRatio = 0.5 * scrollRatio + 0.25
  const compScroll = (compScrollRatio * windowHeight) + scroll
  const beginTimestamp = range[0]
    ? range[0].timestamp
    : 0
  const endTimestamp = range[range.length - 1]
    ? range[range.length - 1].timestamp
    : 0
  let scrollDate = beginTimestamp
  const reversedRange = [...range].sort((a, b) => b.offset - a.offset)
  reversedRange.some((fact, i) => {
    if ((fact.offset + fact.height / 2) < compScroll) {
      const nFact = i > 0
        ? reversedRange[i - 1]
        : {
          id: reversedRange.length,
          offset: $(document).height(),
          height: 0,
          timestamp: endTimestamp
        }
      const totalTimespan = endTimestamp - beginTimestamp
      const timespanBetweenFactAndNext = nFact.timestamp - fact.timestamp
      const factTreshold = fact.offset + fact.height / 2
      const nFactTreshold = nFact.offset + nFact.height / 2
      const spaceBetweenFactAndNext = nFactTreshold - factTreshold
      const scrolledAfterFact = compScroll - factTreshold
      const scrolledAfterRatio = scrolledAfterFact / spaceBetweenFactAndNext
      const timespanScrolledAfter = scrolledAfterRatio * timespanBetweenFactAndNext
      const factTimestampAfterBeginning = fact.timestamp - beginTimestamp
      const timespanScrolled = factTimestampAfterBeginning + timespanScrolledAfter
      const timespanScrolledRatio = timespanScrolled / totalTimespan
      const css = `${timespanScrolledRatio * 100}%`
      $('.timeline-panel__events-cursor_desktop').css({ top: css })
      $('.timeline-panel__events-cursor_mobile').css({ left: css })
      return true
    } else {
      $('.timeline-panel__events-cursor_desktop').css({ top: '0%' })
      $('.timeline-panel__events-cursor_mobile').css({ left: '0%' })
      return false
    }
  })
  $('.scroller').css({ top: `${compScrollRatio * 100}vh` })
}

function scrollToFact (id) {
  const range = state.timesAndOffsets
  range.forEach(fact => {
    if (fact.id === id) {
      const windowHeight = $(window).height()
      const documentHeight = $(document).height()
      const { offset, height } = fact
      const factCenterOffset = offset + height / 2
      const target = factCenterOffset - windowHeight / 2
      $('html, body')
        .animate({ scrollTop: target }, 1000)
    }
  })
}
