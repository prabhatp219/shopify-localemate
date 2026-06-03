import axios from 'axios';

async function main() {
  try {
    const res = await axios.get('https://shopify-localemate.onrender.com/api/health');
    console.log('Server is ONLINE:', res.status, res.data);
  } catch (error) {
    console.log('Server is OFFLINE:', error.message);
  }
}

main();
