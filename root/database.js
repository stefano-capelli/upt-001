const customers = [ { customerId: '123101', location: 'London' },
                    { customerId: '123102', location: 'Liverpool' },
                    { customerId: '123103', location: 'Leeds' },
                    { customerId: '123104', location: 'Leicester' },
                    { customerId: '123105', location: 'Manchester' }, ];

const products = [ { id: "0101", name: 'Arsenal TV',      category: 'sports', locations: ['London'] },
                   { id: "0102", name: 'Chelsea TV',      category: 'sports', locations: ['London'] },
                   { id: "0103", name: 'Liverpool TV',    category: 'sports', locations: ['Liverpool'] },
                   { id: "0204", name: 'Sky News',        category: 'news',   locations: [] },
                   { id: "0205", name: 'Sky Sports News', category: 'news',   locations: [] }, ]

function getLocation(customerId) {
    const data = customers.filter(el => (el.customerId === customerId));

    if (data.length === 0) return null;

    return { location: data[0].location };
};

function getProducts(locationId) {
    const data = products.filter(el => (el.locations.length === 0 || el.locations.includes(locationId)))
                         .map(el => ({ channelId: el.id, channelName: el.name, category: el.category }));

    if (data.length === 0) return null;

    return data;
}

module.exports = {
    getLocation,
    getProducts
};
