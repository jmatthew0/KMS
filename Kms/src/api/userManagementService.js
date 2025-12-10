// src/api/adminUserService.js
import { supabase } from '../lib/supabaseClient';

// Get all users with details
export const getAllUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get document counts for each user
    const usersWithStats = await Promise.all(
      (data || []).map(async (user) => {
        const { count: docCount } = await supabase
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .eq('created_by', user.id);

        return {
          ...user,
          document_count: docCount || 0
        };
      })
    );

    return { data: usersWithStats, error: null };
  } catch (error) {
    console.error('Error fetching users:', error);
    return { data: null, error };
  }
};

// Get single user details
export const getUserDetails = async (userId) => {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    // Get user's documents
    const { data: documents } = await supabase
      .from('documents')
      .select(`
        id,
        title,
        status,
        created_at,
        views_count,
        category:categories(name)
      `)
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    // Get user's activity
    const { data: activity } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    return {
      data: {
        profile,
        documents: documents || [],
        activity: activity || []
      },
      error: null
    };
  } catch (error) {
    console.error('Error fetching user details:', error);
    return { data: null, error };
  }
};

// Update user role
export const updateUserRole = async (userId, newRole) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error updating user role:', error);
    return { data: null, error };
  }
};

// Toggle user active status
export const toggleUserStatus = async (userId, isActive) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_active: isActive })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error toggling user status:', error);
    return { data: null, error };
  }
};

// Delete user (soft delete - deactivate)
export const deleteUser = async (userId) => {
  try {
    // Soft delete - just deactivate
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { data: null, error };
  }
};

// Update user profile (admin edit)
export const updateUserProfile = async (userId, updates) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { data: null, error };
  }
};

// Get user statistics
export const getUserStats = async () => {
  try {
    // Total users
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Active users
    const { count: activeUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Users by role
    const { data: roleData } = await supabase
      .from('profiles')
      .select('role');

    const roleCount = roleData?.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});

    // New users this month
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const { count: newUsersThisMonth } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', firstDayOfMonth.toISOString());

    return {
      data: {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        inactiveUsers: (totalUsers || 0) - (activeUsers || 0),
        roleDistribution: roleCount || {},
        newUsersThisMonth: newUsersThisMonth || 0
      },
      error: null
    };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return { data: null, error };
  }
};

// Search users
export const searchUsers = async (searchTerm) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error searching users:', error);
    return { data: null, error };
  }
};

// Bulk update users
export const bulkUpdateUsers = async (userIds, updates) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .in('id', userIds)
      .select();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error bulk updating users:', error);
    return { data: null, error };
  }
};