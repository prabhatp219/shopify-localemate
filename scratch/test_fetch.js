import axios from 'axios';

async function testFetch() {
  try {
    const res = await axios.get('https://shopify-localemate.onrender.com/api/suggestions/applied');
    console.log('Status Code:', res.status);
    console.log('Data:', JSON.stringify(res.data, null, 2));
  } catch (error) {
    console.error('Fetch Error:', error.message);
    if (error.response) {
      console.error('Response Data:', error.response.data);
    }
  }
}

testFetch();
