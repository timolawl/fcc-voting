'use strict';

// socket io -- the cdnjs script is in the HTML template above this script file
var socket = io.connect('http://localhost:5000'); // hardcoded, it seems
//socket.on('news', function (data) {
  
//});




// set up dynamic adding/removing of options from /pollform


// set up dynamic removal of polls in /mypolls

function addOption (btnCounter) {
    // need a way of keeping track of the count.
    // either way, I just add to the end of the last count, even if sparse
    const button = document.createElement('button');
    button.className = 'form__button--delete';
    button.id = `option-${btnCounter}`; // es6 template literal
    button.type = 'button';
    button.textContent = 'X';

    const input = document.createElement('input');
    input.className = 'form__input form__input--options';
    input.setAttribute('type', 'text');
    input.setAttribute('name', 'options');
    input.setAttribute('placeholder', 'New Option');
    input.setAttribute('pattern', '^[a-zA-Z0-9][a-zA-Z0-9_/ .?-]{0,200}$');

    const div = document.createElement('div');
    div.className = 'form__options--option';

    div.appendChild(input)
    div.appendChild(button);

    document.querySelector('.form__options').appendChild(div);
}

function checkForm (path) {
    // on form change or on group of input change, test
    const form = document.querySelector('form');
    // need live nodelist since add/deleting:
    const inputs = document.getElementsByClassName('form__input');
    const submitBtn = document.querySelector('input[type="submit"]');
    submitBtn.disabled = true;
    //const inherentBtnColor = submitBtn.style.background;
    //submitBtn.style.background = 'gray';
    // better way would be to fade it out with a blend? overlay?

    function validateInput () {
        let unique, pw, pwConfirm;

        submitBtn.disabled = true;

        if (Array.from(inputs).every(input => input.value.match(input.getAttribute('pattern')))) {
            if (path === 'createpoll' && inputs.length >= 3) {
                unique = new Set(Array.from(inputs).map(input => input.value));
                if (inputs.length === unique.size)
                    submitBtn.disabled = false;
            }
            else if (path !== 'createpoll') {
                if (path === 'signup') {
                    pw = form.querySelector('.form__input--password');
                    pwConfirm = form.querySelector('.form__input--confirm');
                    if (pw.value === pwConfirm.value) {
                        pw.style.outline = 'initial';
                        pwConfirm.style.outline = 'initial';
                        submitBtn.disabled = false;
                    }
                    else {
                        pw.style.outline = '1px solid red';
                        pwConfirm.style.outline = '1px solid red';
                    }
                }
                else submitBtn.disabled = false;
            }
        }
    }
    form.onkeyup = validateInput;
    form.onclick = validateInput;
}

window.onload = function () {
  // socket io logic:
  if (location.pathname.match(/\/$/)) // if home path
    socket.emit('change room', { room: location.pathname }); // '/'

  if (location.pathname.match(/\/poll\/[0-9a-f-]+$/))
    socket.emit('change room', { room: location.pathname.slice(6) }); // the nonce itself

  if (location.pathname.match(/\/(?:signup|login|reset|createpoll|mypolls)\/?/i))
    socket.emit('leave room', { path: location.pathname.toLowerCase().slice(1) });

/****************/    


    // should separate out the functions based on path?
    // will likely need to refactor this as this seems semantically equivalent to having function declarations within conditionals.
    // delete function
    if (location.pathname.match(/\/createpoll\/?/i)) { // why does this have only 1 slash?

        let buttonCounter = 3; // initial setting since there's already 2 initially.

        document.querySelector('.form').addEventListener('click', e => {

            if (e && e.target.id.match(/^option-\d+$/)) {
                let target = document.getElementById(e.target.id).parentNode;
                target.parentNode.removeChild(target);
            }

            // create function
            if (e && e.target.id === 'option-create') {
                e.preventDefault(); // apparently this is needed for preventing the 'requirement' popup.
                addOption(buttonCounter);
                buttonCounter++; // increment after
            }
        }); // event delegation
    }
    

    if (location.pathname.match(/\/(?:signup|login|reset|createpoll)\/?/i)) {
      // clear out form
      document.querySelector('form').reset();
      // gray out submit button until everything is filled in.
      checkForm(location.pathname.toLowerCase().slice(1));
    }

    if (location.pathname.match(/\/poll\/[0-9a-f-]+$/)) {
      // button click (general):
      Array.prototype.forEach.call(document.querySelectorAll('.created-poll__option'), el => el.addEventListener('click', e => {
        switch (e.target.classList[e.target.classList.length-1]) {
          case 'created-poll__option--vote':
            displayModal('vote');
            break;
          case 'created-poll__option--new-option':
            displayModal('new-option');
            break;
          case 'created-poll__option--share':
            displayModal('share');
            break;
          case 'created-poll__option--delete':
            displayModal('delete');
            break;
          default:
            console.log('uh oh...something went wrong.');
            break;
        }
        //  console.log(e.target.classList[e.target.classList.length - 1]);
      }));

      // better to set up socket io rooms and have the updates broadcast only to those in the same room or to have it such that broadcasts regardless of room but only those in the room will it have any effect? Rooming seems more organized.
      

      /*
      socket.join(location.pathname.slice(1), err => {
        if (err) throw err;
      });
      */


      // on vote submit, pass along the selected option and with socket io update the db
      // emit the event so that it updates...
      // eventlistener for form submissions:
      Array.prototype.forEach.call(document.querySelectorAll('.modal__form'), el => el.addEventListener('submit', e => {
        e.preventDefault(); // still need the post event to get to the back end..
        console.log('something has been submitted.');
        console.log(el.classList);
        console.log(el.firstChild.value);
        
        

        if (el.classList.contains('modal__form--vote')) {
          socket.emit('add vote', { vote: el.firstChild.value, path: location.pathname.slice(6) });
          // gray out the vote button for this user. (add this poll as already voted by this user, or add it to the users who have voted on this poll and prevent that way
          // either way needs to modify the data store to remember this.
        // the idea is that security measures cannot be front end because those elements can be modified using chrome tools, for example..
        // but if that's true, what to prevent users from modifying the socket emit value?
           
        }
        
      }));

      

      var ctx = document.querySelector('.created-poll__poll--canvas');
      var myChart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: optionText,
          datasets: [{
            data: voteCount,
            backgroundColor: [
			  '#8DD3C7',
			  '#FFFFB3',
			  '#BEBADA',
			  '#FB8072',
			  '#80B1D3',
			  '#FDB462',
			  '#B3DE69',
			  '#FCCDE5',
			  '#D9D9D9',
			  '#BC80BD',
			  '#CCEBC5',
			  '#FFED6F'
            ]
          }]
        },
        options: {
          title: {
            display: false,
            fontSize: 14,
            text: pollTitle
          },
          legend: {
            display: true,
            position: 'bottom'
          }
        }
      
      });
      
      socket.on('update poll', function (data) {
        console.log(data.pollOptions);
        optionText = data.pollOptions.map(x => x.optionText);
        voteCount = data.pollOptions.map(x => x.voteCount);
        console.log(optionText);
        console.log(voteCount);
        console.log(myChart.data);
        myChart.data.datasets[0].data = voteCount;
        myChart.update();
        console.log('updating poll..');
      });

      
      //  console.log('on that nonce page');

      //  Chart.defaults.global.elements.arc.backgroundColor = 'rgba(0,0,0,0.3)';
     //   Chart.defaults.global.elements.arc.borderColor = 'lightgray'; //'rgba(0,0,0,0.5)';
       // Chart.defaults.global.elements.arc.borderWidth = 2;
       // Chart.defaults.global.layout.padding = 5;
      //
      // Retrieve the data from the server (socket.io or ajax)
      // HOWEVER, do not populate the chart js labels or title
      // populate the title and labels separately because chart js combines styling
      // and placement of the labels and title with the chart itself, making it hard
      // to keep the chart size the same, etc.
      // if more than 12 just repeat the colors yolo.

      // title simply assign as such:
      // let pollTitle = 'What is your favorite book series?';
      document.querySelector('.created-poll__title').textContent = pollTitle;
      

/*
      const currentLabels = [                
                'The Chronicles of Narnia',
                'Harry Potter',
                'Dragonlance',
                'Forgotten Realms',
                'Star Wars',
                'Magic: The Gathering',
                'Warcraft',
                'Starcraft',
                'Dune',
                'Dan Brown\'s books',
                'Hi Dave',
                'I need more book series'
      ];

      const currentData = [1,2,3,4,5,6,7,8,9,10,11,12];
*/
      // legend is a list, will need to convert to list and then append:
        
     //   document.querySelector('.created-poll__poll--legend') = // set equal to the created list?
      /*
        // create a temporary list to try:
        const sampleArray = [
                'The Chronicles of Narnia',
                'Harry Potter',
                'Dragonlance',
                'Forgotten Realms',
                'Star Wars',
                'Magic: The Gathering',
                'Warcraft',
                'Starcraft',
                'Dune',
                'Dan Brown\'s books',
                'Hi Dave',
                'I need more book series'
              ];

        const unorderedList = document.createElement('ul');
        // for each item in the array, add to li, then append?
          
        for (let i = 0; i < sampleArray.length; i++) {
          let el = document.createElement('li');
          el.textContent = sampleArray[i];
          unorderedList.append(el);
        }

        const legend = document.querySelector('.created-poll__poll--legend');

        while (legend.firstChild) legend.removeChild(legend.firstChild);

        legend.appendChild(unorderedList);
      */
/*
        var ctx = document.querySelector('.created-poll__poll--canvas');
        var myChart = new Chart(ctx, {
            type: 'pie',
            data: JSON.parse(localData),
            
            data: {
              
              labels: currentLabels,              
              datasets: [{
                data: currentData,
                backgroundColor: [
                  '#8DD3C7',
                  '#FFFFB3',
                  '#BEBADA',
                  '#FB8072',
                  '#80B1D3',
                  '#FDB462',
                  '#B3DE69',
                  '#FCCDE5',
                  '#D9D9D9',
                  '#BC80BD',
                  '#CCEBC5',
                  '#FFED6F'
                ]
              }] 
            },
          
            options: {
              title: {
                display: false,
                fontSize: 14,
                text: pollTitle
              },
              legend: {
                display: true,
                position: 'bottom'
              //  boxWidth: 10
              }
            }
          
        });

*/
    }

    // why does having the onclick on the button itself not work?
};

function displayModal (option) {
  // dim the background
  document.querySelector('.modal__overlay').classList.remove('visibility--hide');
  // close button closes modal and relights background
  Array.prototype.forEach.call(document.querySelectorAll('.modal__close'), e => e.addEventListener('click', event => {
    document.querySelector('.modal__overlay').classList.add('visibility--hide');
    Array.prototype.forEach.call(document.querySelectorAll('.modal'), e => e.classList.add('visibility--hide'));
    // rehide the flash message on modal close
    if (document.querySelector('.modal--share'))
      document.querySelector('.modal__flash-message').classList.add('display--hide');
    // clear new-option input field on modal close
    if (document.querySelector('.modal--new-option'))
      document.querySelector('.modal__form--new-option').reset();

  }));
  // same with clicking on the overlay..
  document.querySelector('.modal__overlay').addEventListener('click', () => {
    document.querySelector('.modal__overlay').classList.add('visibility--hide');
    Array.prototype.forEach.call(document.querySelectorAll('.modal'), e => e.classList.add('visibility--hide'));
    if (document.querySelector('.modal--share'))
      document.querySelector('.modal__flash-message').classList.add('display--hide');

    if (document.querySelector('.modal--new-option'))
      document.querySelector('.modal__form--new-option').reset();
  });


  switch (option) {
    case 'vote':
      console.log('i voted');
      // dynamically set up the vote modal (populate the options with the actual options)
      // we know that there are at the very least two options, so populate those first
      // would this make it too slow as it's always dynamic? really minor tbh

      document.querySelector('.modal__vote--dropdown-li:nth-child(2)').textContent = optionText[0];
      document.querySelector('.modal__vote--dropdown-li:nth-child(3)').textContent = optionText[1];
      // add any additional options remaining:
      let numberOfOptions = 2;
      while (optionText[numberOfOptions]) {
        let nextOption = document.createElement('option');
        nextOption.classList.add('modal__vote--dropdown-li');
        nextOption.textContent = optionText[numberOfOptions];
        document.querySelector('.modal__vote--dropdown-ul').appendChild(nextOption);
        numberOfOptions++;
      }
      document.querySelector('.modal--vote').classList.remove('visibility--hide');
      break;
    case 'new-option':
      console.log('creating new option..');
      document.querySelector('.modal--new-option').classList.remove('visibility--hide');
      break;
    case 'share':
      // show the sharing modal
      document.querySelector('.modal--share').classList.remove('visibility--hide');
      document.querySelector('.modal__share--link-box').select();
      // make the clipboard copy the link // may need clipboard js
      document.querySelector('.modal__share--clipboard-button').addEventListener('click', copyPollLink); // copies current selection to clipboard
      break;
    case 'delete':
      console.log('delete');
      document.querySelector('.modal--delete-poll').classList.remove('visibility--hide');
      break;
    default:
      console.log('wat');
      break;
  }

  // close modal setup:
  //
} 


function copyPollLink () {
// select all to get ready to copy
  document.querySelector('.modal__share--link-box').select();
// copy the selection
  document.execCommand('copy');

  document.querySelector('.modal__flash-message').classList.remove('display--hide')

}

/*
// submit function for modal submit buttons, with parameter specifying which button was pressed
function onSubmit (form) {
  console.log('this is the option submitted: ' + form.option);
  socket.emit('submit', function (data) { // or socket.emit...
    
    
  });
  // on submit, I need to modify the mongoose db so that it is reflected there using socket io instead of ajax
//
}

*/

// form submission -> prevent default (not changing page)
// socket io the information
// update from there
// problem is updating the db from the main app section..


