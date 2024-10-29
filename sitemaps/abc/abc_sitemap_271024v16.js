console.log('Demo sitemap: 27.10.24.v15')

// Helper for CCS Selector: Add to Cart 
const getSpecificSelectorByClass = (className) => {
    const element = document.querySelector(`.${className.replace(/ /g, '.')}`);
    
    if (!element) {
        return null;
    }

    const getDetailedSelector = (element) => {
        if (element.id) {
            return `#${element.id}`;
        }

        const path = [];
        while (element && element.nodeType === Node.ELEMENT_NODE) {
            let selector = element.nodeName.toLowerCase();
            if (element.id) {
                selector += `#${element.id}`;
                path.unshift(selector);
                break;
            } else {
                let sib = element, nth = 1;
                while (sib = sib.previousElementSibling) {
                    if (sib.nodeName.toLowerCase() === selector) nth++;
                }
                if (nth !== 1) selector += `:nth-of-type(${nth})`;
            }
            path.unshift(selector);
            element = element.parentNode;
        }

        return path.join(" > ");
    };

    return getDetailedSelector(element);
};
// Helper for Quick buy button

const getButtonValueByClass = (className) => {
  const button = document.querySelector(`.${className.replace(/ /g, '.')}`);
  return button ? button.getAttribute('value') : null;
};
  

// Set logging level in for debugging in Chrome console
SalesforceInteractions.setLoggingLevel('debug')

// resolver for multi domain setup  
/*
const getCookieDomain = () => {
    let currentDomain = window.location.hostname;
    if (currentDomain === "abc-demo.cloud") {
      return "abc-demo.cloud";
    } else if (currentDomain === "abc-demo.my.site.com") {
      return "abc-demo.my.site.com";
    }
  };
  const currentCookieDomain = getCookieDomain();
console.log(currentCookieDomain)
*/
// Initializes the sitemap
SalesforceInteractions.init(
    
    {
    // cookieDomain: currentCookieDomain,
     // could be fixed with helper   
    consents: [{ 
        provider: "Provider",
        purpose: "Tracking",
        status: "Opt In",
      }]
      
    
  }).then(() => {
 
    const { 
      cashDom,
      listener, 
      resolvers,
      sendEvent,
      util,
      CartInteractionName,
      CatalogObjectInteractionName,
      OrderInteractionName,
    } = SalesforceInteractions
  
    const global = {
      locale: 'de_DE',
      listeners: [

// Profile Switcher
        listener('click', '#wpforms-submit-891', (event) => {
            const emailAddress = cashDom('#wpforms-891-field_2').val();
            sendEvent({ 
              interaction: {
                name: 'profileSwitched'
              },
              user: {
                attributes: { 
                  email: emailAddress,
                  eventType: 'identity',
                  isAnonymous: 'False'
                }
              }
            })
           
        })
        
      ],
    /*  
      // attach optional data to every actionEvent that is sent out
      onActionEvent: (actionEvent) => {
        const email = window && window._userInfo && window._userInfo.email
        if (email) {
            actionEvent.user = actionEvent.user || {}
            actionEvent.user.attributes = actionEvent.user.attributes || {}
            actionEvent.user.attributes.emailAddress = email
        }
        return actionEvent
      }
      */
    }
  
    const productIdResolver = resolvers.fromSelector('.sku')
    const cssSelcAddCart = 'single_add_to_cart_button button alt'
    const cssSelcAdd = getSpecificSelectorByClass(cssSelcAddCart)

    const qBuyValue = getButtonValueByClass('single_add_to_cart_button button alt')
    const qBuySelec = `#product-${qBuyValue} > div.summary.entry-summary > form > div.wsppc_div_block.woocommerce_after_add_to_cart_button > p > button`;

    const productPage = {
      name: 'product',
      isMatch: () => resolvers.fromMeta("pagetype")()==="PDP",
      // capture the product being viewed when the page is opened
      interaction: {
        name: CatalogObjectInteractionName.ViewCatalogObject,
        catalogObject: {
          type: 'Product',
          id: productIdResolver
          /*
          attributes: {
            name: resolvers.fromMeta("og:title"),
            url: resolvers.fromHref(),
            imageUrl: resolvers.fromMeta("og:image")
          },
          */
        } 
      },
      listeners: [
        // capture when the user adds this product to their cart
        listener('click', cssSelcAdd, () => {
          sendEvent({
            interaction: {
              name: CartInteractionName.AddToCart,
              lineItem: {
                catalogObjectType: 'Product',
                catalogObjectId: productIdResolver(),
                quantity: parseInt(cashDom('.product .quantity input').val(), 10),
                price: parseFloat(cashDom('.product .price').text().trim())
              }
            }
          })
        }),

        listener('click', qBuySelec, () => {
            sendEvent({
              interaction: {
                name: OrderInteractionName.Purchase,
                order: {
                    id: window.location.pathname.split("/")[3],
                    totalValue: parseFloat(cashDom('.product .price').text().trim()), // auf website checken ,
                    lineItems: [{
                        catalogObjectType: 'Product',
                        catalogObjectId: productIdResolver(),
                        price:  parseFloat(cashDom('.product .price').text().trim()),
                        quantity: parseInt(cashDom('.product .quantity input').val(), 10),
                  }]
                  }
              }
            })
          }),
        
        ]
        
    }
  
    /*
    const homePage = {
      name: 'Home',
      isMatch: ()=> window.location.href === 'https://abc-demo.cloud/', 
    }
    */
   /*
    const orderConfirmationPage = {
      name: 'Order Configuration',
      isMatch: ()=>/\/checkout\/order-received/.test(window.location.href),
      // capture when a user completes an order
      interaction: {
        name: OrderInteractionName.Purchase,
        order: {
          id: window.location.pathname.split("/")[3],
          totalValue: 100, // auf website checken ,
          lineItems: {
              catalogObjectType: 'Product',
              catalogObjectId: () => {
                return DisplayUtils.pageElementLoaded(".woocommerce-table__product-name.product-name > .wc-item-meta p", "html").then((ele) => {
                    return resolvers.fromSelectorMultiple(".woocommerce-table__product-name.product-name > .wc-item-meta p");
                });
            },
            price:  () => {
                return DisplayUtils.pageElementLoaded("td.woocommerce-table__product-total.product-total > span > bdi", "html").then((ele) => {
                    return resolvers.fromSelectorMultiple("td.woocommerce-table__product-total.product-total > span > bdi");
                });
            },
              quantity: () => {
                return DisplayUtils.pageElementLoaded(".product-quantity", "html").then((ele) => {
                    return resolvers.fromSelectorMultiple(".product-quantity");
                });
            },
        }
        }
      }
    }
  */
    // user attributes for real-time resolution needs to be ingested in identity DMO
    const loginPage = {
        name: 'Login Page',
        isMatch: () => window.location.pathname === '/my-account/',
        listeners: [
            // captures user infos
            listener('click', '.woocommerce-form-login__submit', (event) => {
              const emailAddress = cashDom("#username").val();
              sendEvent({
                interaction: {
                    name: 'userLogin'
                },
                user:{
                    attributes: {
                        email: emailAddress,
                        eventType: 'identity',
                        isAnonymous: 'False'
                    }
                }

              })
            }),
            listener('click', '#customer_login > div.u-column2.col-2 > form > p:nth-child(5) > button', (event) => {
              const emailAddress = cashDom("#reg_email").val();
              sendEvent({
                interaction: {
                    name: 'register'
                },
                user:{
                    attributes: {
                        email: emailAddress,
                        eventType: 'identity',
                        isAnonymous: 'False'
                    }
                }

              })
            })
          ]

    }

    const newsArticle = {
        name: 'News Article',
        isMatch: () => resolvers.fromMeta("pagetype")()==="Article",
        interaction: {
            name: CatalogObjectInteractionName.ViewCatalogObject,
            catalogObject: {
              type: 'Article',
              id: window.location.pathname.split("/")[3],
              
            } 
          }
        
    }

    const newsletter = {
        name: 'ABC Newsletter',
        isMatch: () => window.location.pathname === '/abc-newsletter/',
        listeners: [
            // captures us
            listener('click', '#post-515 > div > form > input.newsletter-sign-up', (event) => {
              const emailAddress = cashDom("#username").val();
              const phone = cashDom("#mobile").val();
              const firstname = cashDom("#first_name").val();
              const lastName = cashDom("#last_name").val();
              sendEvent({
                interaction: {
                    name: 'ABC Newsletter Sign-Up'
                },
                user:{
                    attributes: {
                        email: emailAddress,
                        eventType: 'identity',
                        firstName: firstname,
                        lastName: lastName,
                        phoneNumber: phone,
                        isAnonymous: 'False'
                    }
                }

              })
            })
          ]
        
    }
    /*
    const customerServicePortal = {
        name: 'Customer Service Portal - Login Page"',
        isMatch: () => window.location.pathname === "/abccustomerservice/s/login/",
        listeners: [
            listener('click', '#centerPanel > div > div.slds-col--padded.contentRegion.comm-layout-column > div > div:nth-child(2) > div > div:nth-child(4) > button', (event) => {
              const emailAddress = cashDom("input[placeholder='Username']").val();
              sendEvent({
                interaction: {
                    name: 'Customer Service Portal - Login Successful'
                },
                user:{
                    attributes: {
                        email: emailAddress,
                        eventType: 'contactPointEmail',
                        isAnonymous: 'False'
                    }
                }

              })
            })
          ]
        
    }
  */
    /*
    const checkoutPage = {
        name: 'Checkout Page',
        isMatch: ()=>/\/checkout/.test(window.location.href),
      }
    */
    const productCategory = {
        name: 'Product Category',
        isMatch: () => resolvers.fromMeta("pagetype")()==="PLP",
        interaction: {
          name: CatalogObjectInteractionName.ViewCatalogObject,
          catalogObject: {
            type: 'Product Category',
            id: resolvers.fromSelector('#main > header > h1'),
           
          } 
        },
        /*
        listeners: [
          listener('click', cssSelcAdd, () => {
            sendEvent({
              interaction: {
                name: CartInteractionName.AddToCart,
                lineItem: {
                  catalogObjectType: 'Product',
                  catalogObjectId: productIdResolver(),
                  quantity: parseInt(cashDom('.product .quantity input').val(), 10),
                  price: parseFloat(cashDom('.product .price').text().trim())
                }
              }
            })
          })
        ]
          */
      }
    
    const newsCategory = {
        name: 'News Category',
        isMatch: () => /\/category\/news\/*/.test(window.location.pathname),
        interaction: {
          name: CatalogObjectInteractionName.ViewCatalogObject,
          catalogObject: {
            type: 'Article Category',
            id: resolvers.fromSelector("#main > header > h1 > span"),
            
          } 
        }
      }
    /*
    const customerServicePortalMyPrCe = {
        name: 'Customer Service Portal - My Preference Center',
        isMatch: () => window.location.pathname === "/abccustomerservice/s/consent"
      }  
    */
      const pageTypeDefault = {
        name: 'default',
      }

    SalesforceInteractions.initSitemap({
      global,
      pageTypeDefault,
      pageTypes: [
        loginPage,
        newsArticle, 
        // orderConfirmationPage, 
        productPage, 
        // homePage,
        newsletter, 
        // checkoutPage, 
        // customerServicePortal, 
        productCategory, 
        newsCategory,
        // customerServicePortalMyPrCe
    ]
    })
    console.log('sitemap initialized')
  }, 
  // can be switched on, if the Sitemap needs to be invoked only once per request
 // { once: true }
); 
