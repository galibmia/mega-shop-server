const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// Middlewares
// CORS Configuration
const allowedOrigins = ['https://mega-shop-app.netlify.app'];
app.use(cors({
  origin: (origin, callback) => {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
app.use(express.json());

// DB Connection
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jedysg5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server (optional starting in v4.7)
    client.connect();
    console.log("Connected to MongoDB");

    const productsCollection = client.db('megaShopDB').collection('products');

    app.get('/products', async (req, res) => {
      const page = parseInt(req.query.page) || 0;
      const limit = parseInt(req.query.limit) || 10;
      console.log(`Fetching products - Page: ${page}, Limit: ${limit}`);
      const products = await productsCollection
        .find()
        .skip(page * limit)
        .limit(limit)
        .toArray();
      res.send(products);
    });

    app.post('/productsByIds', async (req, res) => {
      const ids = req.body; // Expecting an array of product IDs in the request body
      console.log(`Fetching products by IDs: ${ids}`);
      const objectIds = ids.map(id => new ObjectId(id)); // Convert string IDs to MongoDB ObjectIds
      const products = await productsCollection.find({ _id: { $in: objectIds } }).toArray();
      res.send(products);
    });

    app.get('/totalProducts', async (req, res) => {
      console.log('Endpoint /totalProducts hit');
      try {
        const result = await productsCollection.estimatedDocumentCount();
        console.log(`Total products count: ${result}`);
        res.send({ totalProducts: result });
      } catch (error) {
        console.error("Error fetching total products count:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close(); // Uncomment if you want to close the client connection after run
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Server is running');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
