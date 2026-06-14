import db_module from "./db_module";

const background_comms = (() => {

  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('background_comms message: ', message);
    console.log('background_comms sender: ', sender);
    if (sender.id === browser.runtime.id) {
      switch (message.type) {
        case 'GET_ALL_ARTICLES':
          // const response = db_module.getArticlesAll();
          return db_module.getArticlesAll();
        // sendResponse(response);
        // return true;
      }
    }
  });

  //   async function _send_articles_all() {
  //     const articles = await db.getAll('articles');
  //     browser.runtime.sendMessage({
  //       type: 'ARTICLES_RESPONSE',
  //       requestId: '123',
  //       articles: articles
  //     });
  //   }


})()

export default background_comms;
