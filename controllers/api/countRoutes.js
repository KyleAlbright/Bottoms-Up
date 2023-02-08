const router = require("express").Router();
const { Inventory, User } = require('../../models');
const withAuth = require('../../utils/auth');
const sendEmail = require('../../utils/sendEmail');
const sendOrder = require('../../utils/sendOrder');

router.get('/', withAuth, async (req, res) => {
 try {
  // get all projects and JOIN with user data
  const inventoryData = await Inventory.findAll({
    order: [['quantity', 'ASC']],      
  });


    // serialize data so the template can read it
    const inventories = inventoryData.map((stock) => stock.get({ plain: true }));

    // create an array of par level and quantity level based on the ASC order
    const par_level = inventoryData.map((par) => par.par_min);
    const quantity_level = inventoryData.map((qty) => qty.quantity);
    const product = inventoryData.map((product) => product.product);
    const state =[];
    let orderData = [];

    // for loop to check inventory status
    if ((par_level.length === quantity_level.length) && par_level.length > 0) {
      for (let i=0; i<inventories.length; i++){
        if(quantity_level[i] > par_level[i]){
          state[i] = 2;
        } else if(quantity_level[i] === par_level[i]){
          state[i] = 1;
        } else {
          state[i] = 0;
          sendEmail(product[i])
          .catch((err) => { alert(err)}
          );
          orderData.push(inventories[i]);
        }
      }
    }
    
    // prepare the data (when current quantity is below par level) for csv download
    const csvData = JSON.stringify(orderData);

    if (orderData.length > 0){
      sendOrder(csvData)
      .catch((err) => { console.log(err)}
      )
     
    } 
  
    // pass serialized data and session flag into template
    res.render('count', { 
      layout: "main",
      inventories, 
      loggedIn: req.session.loggedIn,
      userAdmin: req.session.userAdmin,
      state,
      csvData
    });
   } catch (err) {
    res.status(500).json(err);
  }

});

module.exports = router;