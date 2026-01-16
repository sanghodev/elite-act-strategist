import { initSupabase } from './supabaseClient';
import { ProblemImage, StudyCollection, CollectionItem, EnhancedHistoryItem, CollectionWithItems } from '../types';

// ============================================
// Problem Images Service
// ============================================

/**
 * Upload a problem image to Supabase Storage and create database record
 */
export const uploadProblemImage = async (
    userId: string,
    imageFile: File,
    metadata: {
        section: string;
        questionNumber?: number;
        testSource?: string;
        tags?: string[];
        notes?: string;
    }
): Promise<ProblemImage | null> => {
    const supabase = initSupabase();
    if (!supabase) return null;

    try {
        // 1. Upload image to Supabase Storage
        const fileName = `${userId}/${Date.now()}_${imageFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('problem-images')
            .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        // 2. Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('problem-images')
            .getPublicUrl(fileName);

        // 3. Create database record
        const { data, error } = await supabase
            .from('problem_images')
            .insert({
                user_id: userId,
                image_url: publicUrl,
                section: metadata.section,
                question_number: metadata.questionNumber,
                test_source: metadata.testSource,
                tags: metadata.tags || [],
                notes: metadata.notes,
                is_favorite: false
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error uploading problem image:', error);
        return null;
    }
};

/**
 * Get all problem images for a user
 */
export const getProblemImages = async (
    userId: string,
    filters?: {
        section?: string;
        tags?: string[];
        isFavorite?: boolean;
    }
): Promise<ProblemImage[]> => {
    const supabase = initSupabase();
    if (!supabase) return [];

    try {
        let query = supabase
            .from('problem_images')
            .select('*')
            .eq('user_id', userId)
            .order('uploaded_at', { ascending: false });

        if (filters?.section) {
            query = query.eq('section', filters.section);
        }

        if (filters?.isFavorite !== undefined) {
            query = query.eq('is_favorite', filters.isFavorite);
        }

        if (filters?.tags && filters.tags.length > 0) {
            query = query.contains('tags', filters.tags);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching problem images:', error);
        return [];
    }
};

/**
 * Toggle favorite status
 */
export const toggleFavoriteImage = async (
    imageId: string,
    isFavorite: boolean
): Promise<boolean> => {
    const supabase = initSupabase();
    if (!supabase) return false;

    try {
        const { error } = await supabase
            .from('problem_images')
            .update({ is_favorite: isFavorite })
            .eq('id', imageId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error toggling favorite:', error);
        return false;
    }
};

/**
 * Delete a problem image
 */
export const deleteProblemImage = async (
    imageId: string,
    imageUrl: string
): Promise<boolean> => {
    const supabase = initSupabase();
    if (!supabase) return false;

    try {
        // 1. Delete from storage
        const fileName = imageUrl.split('/').pop();
        if (fileName) {
            await supabase.storage
                .from('problem-images')
                .remove([fileName]);
        }

        // 2. Delete database record
        const { error } = await supabase
            .from('problem_images')
            .delete()
            .eq('id', imageId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting problem image:', error);
        return false;
    }
};

// ============================================
// Study Collections Service
// ============================================

/**
 * Create a new study collection
 */
export const createCollection = async (
    userId: string,
    name: string,
    description?: string,
    color?: string,
    icon?: string,
    autoFilter?: any
): Promise<StudyCollection | null> => {
    const supabase = initSupabase();
    if (!supabase) return null;

    try {
        const { data, error } = await supabase
            .from('study_collections')
            .insert({
                user_id: userId,
                name,
                description,
                color: color || '#2e7dff',
                icon: icon || '📚',
                auto_filter: autoFilter
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error creating collection:', error);
        return null;
    }
};

/**
 * Get all collections for a user
 */
export const getCollections = async (userId: string): Promise<StudyCollection[]> => {
    const supabase = initSupabase();
    if (!supabase) return [];

    try {
        const { data, error } = await supabase
            .from('study_collections')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching collections:', error);
        return [];
    }
};

/**
 * Get collection with all items (history + images)
 */
export const getCollectionWithItems = async (
    collectionId: string
): Promise<CollectionWithItems | null> => {
    const supabase = initSupabase();
    if (!supabase) return null;

    try {
        // 1. Get collection
        const { data: collection, error: collectionError } = await supabase
            .from('study_collections')
            .select('*')
            .eq('id', collectionId)
            .single();

        if (collectionError) throw collectionError;

        // 2. Get collection items with history and images
        const { data: items, error: itemsError } = await supabase
            .from('collection_items')
            .select(`
        *,
        history:history_id (
          *,
          problem_image:problem_image_id (*)
        )
      `)
            .eq('collection_id', collectionId)
            .order('position');

        if (itemsError) throw itemsError;

        return {
            ...collection,
            items: items?.map(item => ({
                history: item.history as EnhancedHistoryItem,
                collection_notes: item.collection_notes,
                position: item.position
            })) || [],
            item_count: items?.length || 0
        };
    } catch (error) {
        console.error('Error fetching collection with items:', error);
        return null;
    }
};

/**
 * Add history item to collection
 */
export const addToCollection = async (
    collectionId: string,
    historyId: string,
    notes?: string
): Promise<boolean> => {
    const supabase = initSupabase();
    if (!supabase) return false;

    try {
        // Get current max position
        const { data: maxPos } = await supabase
            .from('collection_items')
            .select('position')
            .eq('collection_id', collectionId)
            .order('position', { ascending: false })
            .limit(1)
            .single();

        const nextPosition = (maxPos?.position || 0) + 1;

        const { error } = await supabase
            .from('collection_items')
            .insert({
                collection_id: collectionId,
                history_id: historyId,
                position: nextPosition,
                collection_notes: notes
            });

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error adding to collection:', error);
        return false;
    }
};

/**
 * Remove item from collection
 */
export const removeFromCollection = async (
    collectionId: string,
    historyId: string
): Promise<boolean> => {
    const supabase = initSupabase();
    if (!supabase) return false;

    try {
        const { error } = await supabase
            .from('collection_items')
            .delete()
            .eq('collection_id', collectionId)
            .eq('history_id', historyId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error removing from collection:', error);
        return false;
    }
};

/**
 * Delete a collection
 */
export const deleteCollection = async (collectionId: string): Promise<boolean> => {
    const supabase = initSupabase();
    if (!supabase) return false;

    try {
        const { error } = await supabase
            .from('study_collections')
            .delete()
            .eq('id', collectionId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting collection:', error);
        return false;
    }
};

/**
 * Update collection
 */
export const updateCollection = async (
    collectionId: string,
    updates: Partial<StudyCollection>
): Promise<boolean> => {
    const supabase = initSupabase();
    if (!supabase) return false;

    try {
        const { error } = await supabase
            .from('study_collections')
            .update(updates)
            .eq('id', collectionId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error updating collection:', error);
        return false;
    }
};
