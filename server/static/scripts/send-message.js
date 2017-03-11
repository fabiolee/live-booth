/* eslint-env browser,  es6 */

function getDetails() {
  const details = window.localStorage.getItem('last-known-details');
  try {
    if (details) {
      return JSON.parse(details);
    }
  } catch (err) {
    // NOOP
  }
  return null;
}

function saveDetails(details) {
  window.localStorage.setItem('last-known-details',
    JSON.stringify(details));
}

function sendPushMessage() {
  const subscriptionTextArea1 = document.querySelector('#push-subscription-1');
  const subscriptionTextArea2 = document.querySelector('#push-subscription-2');
  const subscriptionTextArea3 = document.querySelector('#push-subscription-3');
  const textToSendTextArea = document.querySelector('#push-data');

  const subscriptionString1 = subscriptionTextArea1.value.trim();
  const subscriptionString2 = subscriptionTextArea2.value.trim();
  const subscriptionString3 = subscriptionTextArea3.value.trim();
  const dataString = textToSendTextArea.value;

  saveDetails({
    subscription1: subscriptionString1,
    subscription2: subscriptionString2,
    subscription3: subscriptionString3,
    data: dataString
  });

  if (subscriptionString1.length === 0 ) {
    return Promise.reject(new Error('Please provide a push subscription.'));
  }

  let subscriptionObject1 = null;
  try {
    subscriptionObject1 = JSON.parse(subscriptionString1);
  } catch (err) {
    return Promise.reject(new Error('Unable to parse subscription as JSON'));
  }
  let subscriptionObject2 = null;
  if (subscriptionString2) {
    try {
        subscriptionObject2 = JSON.parse(subscriptionString2);
      } catch (err) { }
  }
  let subscriptionObject3 = null;
  if (subscriptionString3) {
      try {
          subscriptionObject3 = JSON.parse(subscriptionString3);
        } catch (err) { }
    }

  if (!subscriptionObject1.endpoint) {
    return Promise.reject(new Error('The subscription MUST have an endpoint'));
  }

  if (subscriptionObject1.endpoint.indexOf('…') !== -1) {
    return Promise.reject(new Error('The subscription endpoint appears to be ' +
      'truncated (It has \'...\' in it).\n\nDid you copy it from the console ' +
      'in Chrome?')
    );
  }

  const publicElement = document.querySelector('.js-public-key');
  const privateElement = document.querySelector('.js-private-key');

  var result;
  if (subscriptionObject1) {
    result = apiCall(subscriptionObject1, dataString, publicElement, privateElement);
  }
  if (subscriptionObject2) {
    result = apiCall(subscriptionObject2, dataString, publicElement, privateElement);
  }
  if (subscriptionObject3) {
    result = apiCall(subscriptionObject3, dataString, publicElement, privateElement);
  }
  return result;
}

function apiCall(subscriptionObject, dataString, publicElement, privateElement) {
    return fetch('/api/send-push-msg', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscription: subscriptionObject,
          data: dataString,
          applicationKeys: {
            public: publicElement.textContent,
            private: privateElement.textContent,
          }
        })
      })
      .then((response) => {
        if (response.status !== 200) {
          return response.text()
          .then((responseText) => {
            throw new Error(responseText);
          });
        }
      });
}

function initialiseUI() {
  const sendBtn = document.querySelector('.js-send-push');
  sendBtn.addEventListener('click', () => {
    sendBtn.disabled = true;

    sendPushMessage()
    .catch((err) => {
      console.error(err);
      window.alert(err.message);
    })
    .then(() => {
      sendBtn.disabled = false;
    });
  });

  const previousDetails = getDetails();
  if (previousDetails) {
    const subscriptionTextArea1 = document.querySelector('#push-subscription-1');
    const subscriptionTextArea2 = document.querySelector('#push-subscription-2');
    const subscriptionTextArea3 = document.querySelector('#push-subscription-3');
    const textToSendTextArea = document.querySelector('#push-data');

    subscriptionTextArea1.value = previousDetails.subscription1;
    subscriptionTextArea2.value = previousDetails.subscription2;
    subscriptionTextArea3.value = previousDetails.subscription3;
    textToSendTextArea.value = previousDetails.data;
  }

  sendBtn.disabled = false;
}

window.addEventListener('load', () => {
  initialiseUI();
});
