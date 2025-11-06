'use client'

/**
 * Force dynamic rendering to prevent static generation issues
 * This ensures the page is rendered on each request
 */
export const dynamic = 'force-dynamic'

/**
 * Home Page Component - CRUD Operations
 * 
 * This component implements complete CRUD (Create, Read, Update, Delete) operations:
 * - Create: Add new username to database
 * - Read: Fetch and display all users in a table
 * - Update: Edit existing username
 * - Delete: Remove user from database
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// Type definition for user data
interface User {
  id: number
  username: string
}

export default function Home() {
  // State to store all users fetched from the database
  const [users, setUsers] = useState<User[]>([])
  
  // State to control visibility of Add Data form
  // When true, the Add Data form is shown; when false, it's hidden
  const [showAddForm, setShowAddForm] = useState(false)
  
  // State to store the username input value for Add Data form
  const [newUsername, setNewUsername] = useState('')
  
  // State to track which user is being edited (null means no user is being edited)
  const [editingUserId, setEditingUserId] = useState<number | null>(null)
  
  // State to store the updated username value in the Update form
  const [updatedUsername, setUpdatedUsername] = useState('')
  
  // State to track if data is being fetched
  const [isLoading, setIsLoading] = useState(true)
  
  // State to track if insert operation is in progress
  const [isInserting, setIsInserting] = useState(false)
  
  // State to track if update operation is in progress
  const [isUpdating, setIsUpdating] = useState(false)
  
  // State to track if delete operation is in progress
  const [isDeleting, setIsDeleting] = useState(false)
  
  // State to track success messages
  const [insertSuccess, setInsertSuccess] = useState(false)
  const [updateSuccess, setUpdateSuccess] = useState(false)
  const [deleteSuccess, setDeleteSuccess] = useState(false)
  
  // State to track if there's an error
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch all users from the Supabase database
   * 
   * This function fetches all records from the "users" table
   * and stores them in the users state
   * This is the READ operation in CRUD
   */
  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      setError(null)

      /**
       * Fetch all users from the database
       * Using Supabase's select query to get all records from the users table
       * The select() method retrieves all columns (id and username) for all rows
       */
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('id, username') // Select only id and username columns
        .order('id', { ascending: true }) // Order by id in ascending order

      // Check if there was an error while fetching
      if (fetchError) {
        setError(`Error fetching data: ${fetchError.message}`)
        return
      }

      // Update the users state with the fetched data
      if (data) {
        setUsers(data as User[])
      }
    } catch (err) {
      // Catch any unexpected errors
      setError('An unexpected error occurred while fetching data')
    } finally {
      // Always reset loading state after operation completes
      setIsLoading(false)
    }
  }

  /**
   * Fetch users when the component first loads
   * 
   * useEffect runs when the component mounts (page loads)
   * This ensures data is fetched as soon as the page loads
   */
  useEffect(() => {
    fetchUsers()
  }, [])

  /**
   * Handle Add Data button click
   * 
   * This function is called when the user clicks the "Add Data" button
   * It shows the Add Data form by setting showAddForm to true
   */
  const handleAddDataClick = () => {
    // Show the Add Data form
    setShowAddForm(true)
    // Reset any previous form data
    setNewUsername('')
    // Reset success messages and errors
    setInsertSuccess(false)
    setError(null)
  }

  /**
   * Handle form submission for adding new data
   * 
   * This function is called when the user clicks Submit in the Add Data form
   * It inserts the new username into the database
   * This is the CREATE operation in CRUD
   */
  const handleAddSubmit = async (e: React.FormEvent) => {
    // Prevent the default form submission behavior (page refresh)
    e.preventDefault()

    // Validate that username is not empty
    if (!newUsername.trim()) {
      setError('Username cannot be empty')
      return
    }

    try {
      setIsInserting(true)
      setError(null)
      setInsertSuccess(false)

      /**
       * Insert new data into the Supabase database
       * 
       * Using Supabase's insert query to add the new username to the "users" table
       * The insert method returns a response object with data and error properties
       * This is the CREATE operation in CRUD
       */
      const { data, error: insertError } = await supabase
        .from('users')
        .insert([
          { username: newUsername.trim() } // Insert the username into the users table
        ])
        .select() // Select the inserted data to return it (requires SELECT policy)

      // Check if there was an error during insertion
      if (insertError) {
        // Check if the error is related to Row-Level Security (RLS) policy
        if (insertError.message.includes('row-level security policy') || insertError.message.includes('RLS')) {
          setError(`RLS Policy Error: ${insertError.message}. Make sure the policy targets "public" role, not "authenticated".`)
        } else {
          // Set error message for other insertion failures
          setError(`Error: ${insertError.message}`)
        }
        return
      }

      /**
       * Update the local state to reflect the change immediately
       * 
       * Instead of refreshing the entire page, we add the new user
       * to the users array, so the table updates without page reload
       */
      if (data && data.length > 0) {
        // Add the new user to the users array
        setUsers([...users, data[0] as User])

        // Show success message
        setInsertSuccess(true)
        
        // Hide the Add Data form after successful insertion
        setShowAddForm(false)
        
        // Clear the form input
        setNewUsername('')
      }
    } catch (err) {
      // Catch any unexpected errors
      setError('An unexpected error occurred while inserting data')
    } finally {
      // Always reset inserting state after operation completes
      setIsInserting(false)
    }
  }

  /**
   * Handle Update button click
   * 
   * This function is called when the user clicks the "Update" button for a specific row
   * It sets the editing state and pre-fills the form with the current username
   */
  const handleUpdateClick = (user: User) => {
    // Set which user is being edited (by their ID)
    setEditingUserId(user.id)
    
    // Pre-fill the form input with the current username
    setUpdatedUsername(user.username)
    
    // Reset success messages and error
    setUpdateSuccess(false)
    setDeleteSuccess(false)
    setError(null)
  }

  /**
   * Handle form submission for updating username
   * 
   * This function is called when the user clicks the "Update" button in the Update form
   * It updates the username in the database and refreshes the table
   * This is the UPDATE operation in CRUD
   */
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    // Prevent the default form submission behavior (page refresh)
    e.preventDefault()

    // Validate that username is not empty
    if (!updatedUsername.trim()) {
      setError('Username cannot be empty')
      return
    }

    // Validate that a user is being edited
    if (editingUserId === null) {
      setError('No user selected for update')
      return
    }

    try {
      setIsUpdating(true)
      setError(null)
      setUpdateSuccess(false)

      /**
       * Update the username in the Supabase database
       * 
       * Using Supabase's update query to modify the username for the selected user
       * The eq() method filters to find the user with the matching ID
       * The update() method updates the username field with the new value
       * This is the UPDATE operation in CRUD
       */
      const { data, error: updateError } = await supabase
        .from('users')
        .update({ username: updatedUsername.trim() }) // Update the username field
        .eq('id', editingUserId) // Find the user with matching ID
        .select() // Select the updated data to return it (requires SELECT policy)

      // Check if there was an error during update
      if (updateError) {
        // Check if the error is related to Row-Level Security (RLS) policy
        if (updateError.message.includes('row-level security policy') || updateError.message.includes('RLS')) {
          setError(`RLS Policy Error: ${updateError.message}. Make sure the policy targets "public" role, not "authenticated".`)
        } else {
          // Set error message for other update failures
          setError(`Error: ${updateError.message}`)
        }
        return
      }

      /**
       * Update the local state to reflect the change immediately
       * 
       * Instead of refreshing the entire page, we update the users array
       * with the new username value for the updated user
       */
      if (data && data.length > 0) {
        // Update the users array: find the user and update their username
        setUsers(users.map(user => 
          user.id === editingUserId 
            ? { ...user, username: updatedUsername.trim() } // Update this user's username
            : user // Keep other users unchanged
        ))

        // Show success message
        setUpdateSuccess(true)
        
        // Reset editing state and form
        setEditingUserId(null)
        setUpdatedUsername('')
      }
    } catch (err) {
      // Catch any unexpected errors
      setError('An unexpected error occurred while updating data')
    } finally {
      // Always reset updating state after operation completes
      setIsUpdating(false)
    }
  }

  /**
   * Cancel the update operation
   * 
   * This function is called when the user wants to cancel editing
   * It resets the editing state and form
   */
  const handleCancelUpdate = () => {
    // Hide the Update form by resetting editing state
    setEditingUserId(null)
    setUpdatedUsername('')
    setUpdateSuccess(false)
    setError(null)
  }

  /**
   * Handle Delete button click
   * 
   * This function is called when the user clicks the "Delete" button for a specific row
   * It deletes the record from the database and updates the table
   * This is the DELETE operation in CRUD
   */
  const handleDelete = async (userId: number, username: string) => {
    // Confirm deletion with the user
    if (!confirm(`Are you sure you want to delete user "${username}"?`)) {
      return // User cancelled the deletion
    }

    try {
      setIsDeleting(true)
      setError(null)
      setDeleteSuccess(false)
      setUpdateSuccess(false)

      /**
       * Delete the record from the Supabase database
       * 
       * Using Supabase's delete query to remove the user from the "users" table
       * The eq() method filters to find the user with the matching ID
       * The delete() method removes that specific record
       * This is the DELETE operation in CRUD
       */
      const { error: deleteError } = await supabase
        .from('users')
        .delete() // Delete the record
        .eq('id', userId) // Find the user with matching ID

      // Check if there was an error during deletion
      if (deleteError) {
        // Check if the error is related to Row-Level Security (RLS) policy
        if (deleteError.message.includes('row-level security policy') || deleteError.message.includes('RLS')) {
          setError(`RLS Policy Error: ${deleteError.message}. Make sure the policy targets "public" role, not "authenticated".`)
        } else {
          // Set error message for other deletion failures
          setError(`Error: ${deleteError.message}`)
        }
        return
      }

      /**
       * Update the local state to reflect the change immediately
       * 
       * Instead of refreshing the entire page, we remove the deleted user
       * from the users array, so the table updates without page reload
       */
      setUsers(users.filter(user => user.id !== userId)) // Remove the deleted user from the array

      // Show success message
      setDeleteSuccess(true)
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setDeleteSuccess(false)
      }, 3000)
    } catch (err) {
      // Catch any unexpected errors
      setError('An unexpected error occurred while deleting data')
    } finally {
      // Always reset deleting state after operation completes
      setIsDeleting(false)
    }
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Heading */}
        <h1 className="text-2xl font-bold mb-6 text-center">Crud Operation</h1>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Insert Success Message */}
        {insertSuccess && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            Data has successfully been inserted into the database.
          </div>
        )}

        {/* Update Success Message */}
        {updateSuccess && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            Username has successfully been updated.
          </div>
        )}

        {/* Delete Success Message */}
        {deleteSuccess && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            Data has successfully been deleted from the database.
          </div>
        )}

        {/* Add Data Section */}
        <div className="mb-6">
          <button
            onClick={handleAddDataClick} // Handle Add Data button click - shows the form
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add Data
          </button>

          {/* Add Data Form - appears when showAddForm is true */}
          {showAddForm && (
            <div className="mt-4 p-4 border border-gray-300 rounded">
              <h2 className="text-lg font-semibold mb-4">Add New Username</h2>
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label htmlFor="newUsername" className="block mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    id="newUsername"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)} // Update username state on input change
                    placeholder="Enter username"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isInserting} // Disable input while inserting
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isInserting} // Disable button while inserting
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isInserting ? 'Submitting...' : 'Submit'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // Hide the Add Data form
                      setShowAddForm(false)
                      setNewUsername('')
                      setError(null)
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Update Form - appears when editingUserId is not null */}
        {editingUserId !== null && (
          <div className="mb-6 p-4 border border-gray-300 rounded">
            <h2 className="text-lg font-semibold mb-4">Update Username</h2>
            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div>
                <label htmlFor="updatedUsername" className="block mb-2">
                  Username
                </label>
                <input
                  type="text"
                  id="updatedUsername"
                  value={updatedUsername}
                  onChange={(e) => setUpdatedUsername(e.target.value)} // Update username state on input change
                  placeholder="Enter username"
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isUpdating} // Disable input while updating
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isUpdating} // Disable button while updating
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isUpdating ? 'Updating...' : 'Update'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelUpdate} // Cancel the update operation
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  disabled={isUpdating} // Disable button while updating
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Data Table Section */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Data Table</h2>
          
          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-8">Loading data...</div>
          )}

          {/* Data Table */}
          {!isLoading && (
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left">ID</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Username</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="border border-gray-300 px-4 py-2 text-center text-gray-500">
                        There is no data in the database.
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id}>
                        <td className="border border-gray-300 px-4 py-2">{user.id}</td>
                        <td className="border border-gray-300 px-4 py-2">{user.username}</td>
                        <td className="border border-gray-300 px-4 py-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdateClick(user)} // Handle Update button click
                              className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                              disabled={editingUserId !== null || isDeleting} // Disable if another user is being edited or deleting
                            >
                              Update
                            </button>
                            <button
                              onClick={() => handleDelete(user.id, user.username)} // Handle Delete button click
                              className="px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                              disabled={isDeleting || editingUserId !== null} // Disable if deleting or editing
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

