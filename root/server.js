const express     = require('express');
const session     = require('express-session');
const handlebars  = require('express-handlebars').create({ defaultLayout: 'main' });
const http        = require('http');
const connect     = require('connect');
const rest        = require('connect-rest');
const http_utils  = require('./http-utils');
const credentials = require('./credentials.js');
const db          = require('./database.js');

const app = express();

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', 3000);

app.use(require('body-parser').urlencoded({ extended: true }));

app.use(session({
//  cookie: { secure: true }
    resave: false,
    saveUninitialized: false,
    secret: credentials.cookieSecret,
}));

app.use(require('csurf')());
app.use(function(req, res, next){
    res.locals._csrfToken = req.csrfToken();
    next();
});

app.use(express.static(__dirname + '/public'));

// This is where we simulate the login and store the customerId in the session
// by calling this path with the customerId in the query string
app.get('/app/login', function (req, res) {
//  When the user visits the product selection page, it can be assumed a cookie named customerID will be
//  present, which will hold a customer identifier.

//  if (req.query.custId && /\w{6,}/.test(req.query.custId))
    if (true)
    {
        req.session.authenticated = 1;
        req.session.customerId = req.query.custId;

        res.redirect(303, '/app/product-selection');
    }
    else
    {
        // We should redirect to a page where this message can be shown (out of scope for the test)
        res.send('Invalid CustomerId parameter');
    }
});

// The authentication check should be done here (out of scope for the test)
app.get('/app/product-selection', function (req, res) {
    if (req.session.authenticated && req.session.authenticated === 1)
    {
        http_utils.httpRequest('localhost', 3000, 'GET', `/api/customerLocationService/${req.session.customerId}`)
            .then(data => {
                if (data.error) throw new Error(data.error.message);

                return http_utils.httpRequest('localhost', 3000, 'GET', `/api/catalogueService/${data.location}`);
            })
            .then(data => {
                if (data.error) throw new Error(data.error.message);

                session.products = data;

                res.render('product-selection', {
                    textTop:    'Product selection page',
                    textBottom: 'Here you can select your favourite TV channels',
                    customerId:  req.session.customerId,
                    products:    data.map(el => ({ id: el.channelId, channel: el.channelName, [el.category]: true }))
                });
            })
            .catch (error => {
                console.dir(error);

                // It's better to strip away the first part of the odd error message generated by connect-rest
                res.status(500).send(error.message.replace(/^Error occurred: /, ''));
            });
    }
    else
    {
        // We should redirect to a page where this message can be shown (out of scope for the test)
        res.send('Please log in in order to use the Sky e-commerce.');
    }
});

app.get('/app/confirmation', function (req, res) {
    res.redirect(303, '/app/product-selection');
});

app.post('/app/confirmation', function (req, res) {
    if (req.session.authenticated && req.session.authenticated === 1)
    {
        if (req.body.prodId)
        {
            const productsIDs = Array.isArray(req.body.prodId) ? req.body.prodId : [req.body.prodId];

            res.render('confirmation', {
                textTop:    'Confirmation page',
                textBottom: 'Here you can confirm your purchase',
                customerId: req.session.customerId,
                products:   session.products.filter(el => productsIDs.includes(el.channelId))
            });
        }
        else
        {
            res.status(500).send('There was a problem while retrieving the products');
        }
    }
    else
    {
        res.send('Please log in in order to use the Sky e-commerce.')
    }
});

// --------------------------------------------------------------------------------
// This is a simple configuration, just to make things work for the test
const apiOptions = {
	context: '/api',
	domain: require('domain').create()
};

apiOptions.domain.on('error', function (err) {
    console.log('API domain error.\n', err.stack);
    setTimeout(function(){
        console.log('Server shutting down after API domain error.');
        process.exit(1);
    }, 5000);
    server.close();

    const worker = require('cluster').worker;
    if(worker) worker.disconnect();
});

app.use(rest.rester(apiOptions));

// In the current LTS version of Node.js, async functions are not available
function customerLocationService(req, content, callback)
{
    if (!req.params.customerId) return callback(new Error('Missing \'customerId\' parameter'));

    const loc = db.getLocation(req.params.customerId);

    if (loc) {
        callback(null, loc);
    } else {
        const err = new Error('There was a problem retrieving the customer information');
        err.statusCode = 500;
        callback(err);
    }
}

// In the current LTS version of Node.js, async functions are not available
function catalogueService(req, content, callback)
{
    if (!req.params.locationId) return callback(new Error('Missing \'locationId\' parameter'));

    const data = db.getProducts(req.params.locationId);

    if (data) {
        callback(null, data);
    } else {
        const err = new Error('There was a problem while retrieving the products');
        err.statusCode = 500;
        callback(err);
    }
}

rest.get('/customerLocationService/:customerId', customerLocationService);
rest.get('/catalogueService/:locationId', catalogueService);

// custom 404 page
app.use(function (req, res) {
    res.status(404);
    res.render('404');
});

// custom 500 page
app.use(function (err, req, res, next) {
    console.error(err.stack);

    res.status(500);
    res.render('500');
});

app.listen(app.get('port'), function () {
    console.log('Express listening on port %d...', app.get('port'));
});