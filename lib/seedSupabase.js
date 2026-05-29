import { supabase } from './supabaseClient.js';
import * as sampleData from '../data/sampleData.js';

export async function checkAndSeedDatabase() {
  console.log('[Supabase] Checking if database needs seeding...');
  
  try {
    const { count, error } = await supabase.from('events').select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('[Supabase] Error checking events:', error);
      return false;
    }
    
    if (count === 0) {
      console.log('[Supabase] Database is empty. Seeding data...');
      
      // Seed Events
      if (sampleData.upcomingEvents?.length) {
        await supabase.from('events').insert(sampleData.upcomingEvents);
      }
      
      // Seed Past Events
      if (sampleData.pastEvents?.length) {
        await supabase.from('past_events').insert(sampleData.pastEvents);
      }
      
      // Seed Gallery
      if (sampleData.galleryImages?.length) {
        await supabase.from('gallery_images').insert(sampleData.galleryImages);
      }
      
      // Seed Notices
      if (sampleData.notices?.length) {
        await supabase.from('notices').insert(sampleData.notices);
      }
      
      // Seed Work Items
      if (sampleData.workItems?.length) {
        await supabase.from('work_items').insert(sampleData.workItems);
      }
      
      // Seed Partners
      if (sampleData.partners?.length) {
        await supabase.from('partners').insert(sampleData.partners);
      }
      
      // Seed Team Members
      if (sampleData.teamMembers?.length) {
        await supabase.from('team_members').insert(sampleData.teamMembers);
      }
      
      console.log('[Supabase] Seeding complete!');
      return true;
    } else {
      console.log(`[Supabase] Database already has ${count} events. Skipping seed.`);
      return true;
    }
  } catch (err) {
    console.error('[Supabase] Critical error during seeding:', err);
    return false;
  }
}

export async function fetchAllData() {
  const [
    { data: upcomingEvents }, 
    { data: pastEvents }, 
    { data: galleryImages }, 
    { data: notices }, 
    { data: workItems }, 
    { data: partners }, 
    { data: teamMembers }
  ] = await Promise.all([
    supabase.from('events').select('*').order('id'),
    supabase.from('past_events').select('*').order('id'),
    supabase.from('gallery_images').select('*').order('id'),
    supabase.from('notices').select('*').order('id'),
    supabase.from('work_items').select('*').order('id'),
    supabase.from('partners').select('*').order('id'),
    supabase.from('team_members').select('*').order('id')
  ]);

  return {
    upcomingEvents: upcomingEvents || [],
    pastEvents: pastEvents || [],
    galleryImages: galleryImages || [],
    notices: notices || [],
    workItems: workItems || [],
    partners: partners || [],
    teamMembers: teamMembers || []
  };
}
