const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testDelete() {
  try {
    console.log('Testing DELETE method...');
    
    // First, get all books to see what's available
    console.log('\n1. Getting all books:');
    const allBooks = await axios.get(`${BASE_URL}/books`);
    console.log('Available books:', allBooks.data);
    
    if (allBooks.data.length === 0) {
      console.log('No books available to delete. Creating a test book first...');
      
      // Create a test book
      const newBook = await axios.post(`${BASE_URL}/create/book`, {
        title: 'Test Book for Deletion',
        author: 'Test Author',
        year: 2024
      });
      console.log('Created test book:', newBook.data);
    }
    
    // Get books again to get the ID
    const booksAfterCreate = await axios.get(`${BASE_URL}/books`);
    const bookToDelete = booksAfterCreate.data[0];
    console.log(`\n2. Attempting to delete book with ID: ${bookToDelete.id}`);
    
    // Test delete
    const deleteResult = await axios.delete(`${BASE_URL}/delete/book/${bookToDelete.id}`);
    console.log('Delete result:', deleteResult.data);
    
    // Verify deletion
    console.log('\n3. Verifying deletion:');
    const booksAfterDelete = await axios.get(`${BASE_URL}/books`);
    console.log('Books after deletion:', booksAfterDelete.data);
    
    // Test deleting non-existent book
    console.log('\n4. Testing deletion of non-existent book:');
    try {
      await axios.delete(`${BASE_URL}/delete/book/99999`);
    } catch (error) {
      console.log('Expected error for non-existent book:', error.response.data);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testDelete();


