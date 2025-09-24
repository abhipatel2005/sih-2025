const bcrypt = require('bcrypt');
const { supabase } = require('../config/supabase');

class User {
  constructor(userData) {
    Object.assign(this, userData);
  }

  // Hash password before saving
  async hashPassword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  // Compare password method
  async comparePassword(candidatePassword) {
    try {
      return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
      throw error;
    }
  }

  // Transform output to hide password
  toJSON() {
    const userObject = { ...this };
    delete userObject.password;
    return userObject;
  }

  // Save user to database
  async save() {
    try {
      // Hash password before saving
      if (this.password && !this.id) { // Only hash for new users
        await this.hashPassword();
      }

      const userData = {
        name: this.name,
        rfid_tag: this.rfidTag || this.rfid_tag,
        role: this.role || 'member',
        status: this.status || 'active',
        email: this.email,
        phone: this.phone,
        password: this.password,
        profile_picture: this.profilePicture || this.profile_picture || '',
        joined_date: this.joinedDate || this.joined_date || new Date().toISOString(),
        skills: this.skills || [],
        bio: this.bio || ''
      };

      let result;
      if (this.id) {
        // Update existing user
        const { password, ...updateData } = userData;
        if (password && this.password !== this.originalPassword) {
          updateData.password = password;
        }
        
        const { data, error } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', this.id)
          .select()
          .single();
          
        if (error) throw error;
        result = data;
      } else {
        // Create new user
        const { data, error } = await supabase
          .from('users')
          .insert(userData)
          .select()
          .single();
          
        if (error) throw error;
        result = data;
        this.id = result.id;
      }

      // Update instance with returned data
      Object.assign(this, result);
      return this;
    } catch (error) {
      throw error;
    }
  }

  // Static method to find user by email
  static async findByEmail(email) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
      return data ? new User(data) : null;
    } catch (error) {
      throw error;
    }
  }

  // Static method to find user by ID
  static async findById(id) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data ? new User(data) : null;
    } catch (error) {
      throw error;
    }
  }

  // Static method to find user by RFID tag
  static async findByRfidTag(rfidTag) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('rfid_tag', rfidTag)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data ? new User(data) : null;
    } catch (error) {
      throw error;
    }
  }

  // Static method to find active users only
  static async findActive() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('status', 'active');

      if (error) throw error;
      return data.map(user => new User(user));
    } catch (error) {
      throw error;
    }
  }

  // Static method to find all users
  static async find(conditions = {}) {
    try {
      let query = supabase.from('users').select('*');

      // Apply conditions
      Object.keys(conditions).forEach(key => {
        if (conditions[key] !== undefined) {
          if (key === 'role' && conditions[key].$ne) {
            query = query.neq('role', conditions[key].$ne);
          } else {
            query = query.eq(key, conditions[key]);
          }
        }
      });

      const { data, error } = await query;
      if (error) throw error;
      return data.map(user => new User(user));
    } catch (error) {
      throw error;
    }
  }

  // Static method to count users
  static async countDocuments(conditions = {}) {
    try {
      let query = supabase.from('users').select('*', { count: 'exact', head: true });

      // Apply conditions
      Object.keys(conditions).forEach(key => {
        if (conditions[key] !== undefined) {
          query = query.eq(key, conditions[key]);
        }
      });

      const { count, error } = await query;
      if (error) throw error;
      return count;
    } catch (error) {
      throw error;
    }
  }

  // Delete user
  async deleteOne() {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', this.id);

      if (error) throw error;
      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = User;
