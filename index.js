const API_URL = 'https://data-fetching-with-streams-api.vercel.app/'
let counter = 0
const inputEl = document.getElementById("input")
const btn = document.getElementById("btn")
async function getQuote(){
    // console.log(inputEl)
    if (inputEl.value == ""){
        return alert("Input field can not be null")
    }
   const res = await fetch(`https://jsonplaceholder.typicode.com/posts/${inputEl.value}`)

   const data = await res.json()
   console.log(data)
   const {userId, ...others} = data
   createPostUI(others)
}
function createPostUI(data){
    const quoteEl = document.getElementById("quote")

    const post = `
    <h4> ID: ${data?.id}</h4>
    <p>${data?.body}<p/>
    <hr/>
    `
    quoteEl.innerHTML = post
}
btn.addEventListener("click", async ()=>{
    await getQuote()
})
async function consumeAPI(signal) {
  const response = await fetch(API_URL, {
    signal
  })
  const reader = response.body
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(parseNDJSON())


  return reader
}

function appendToHTML(element) {
  let elementsCounter = 0
  return new WritableStream({
    write({ title, description, url_anime }) {
      const card = `
      <article>
        <div class="text">
          <h3>[${++counter}] ${title}</h3>
          <p>${description.slice(0, 100)}</p>
          <a href="${url_anime}" target="blank"> Link</a>
        </div>
      </article>
      `
      if (++elementsCounter > 30) {
        element.innerHTML = card
        elementsCounter = 0
        return
      }

      element.innerHTML += card
    },
    abort(reason) {
      console.log('aborted**', reason)
    }
  })
}

// this function will make shure that if two chunks come from a single transmission
// convert it split it in break lines
// given:{}\n{}
// should be:
//    {}
//    {}

function parseNDJSON() {
  
  return new TransformStream({
    transform(chunk, controller) {
      for (const item of chunk.split('\n')) {
        try {
          controller.enqueue(JSON.parse(item))
        } catch (error) {
          
          // if the arrived data is not completed, it should stored in memory until completed
        
        }
      }

    }
  })
}
const [
  start,
  stop,
  cards
] = ['start', 'stop', 'cards'].map(item => document.getElementById(item))

let abortController = new AbortController()
start.addEventListener('click', async () => {
  try {
    const readable = await consumeAPI(abortController.signal)
    // add signal and await to handle the abortError exception after abortion
    await readable.pipeTo(appendToHTML(cards), { signal: abortController.signal })
  } catch (error) {
    if (!error.message.includes('abort')) throw error
  }
})

stop.addEventListener('click', () => {
  abortController.abort()
  console.log('aborting...')
  abortController = new AbortController()
})
