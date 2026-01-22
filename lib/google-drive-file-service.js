import GoogleDriveService from './Google_drives_ervice.js';

// Module-level cache to persist across all API routes
let globalFileServiceInstance = null;
let globalFileServiceInitialized = false;

class GoogleDriveFileService {
  constructor() {
    this.driveService = GoogleDriveService.getInstance();
    this.initialized = globalFileServiceInitialized; // Use global state
    this.cache = {
      groups: new Map(),
      subjects: new Map(),
      years: null,
      months: new Map(),
      folderIds: new Map() // Cache folder IDs to avoid repeated navigation
    };
  }

  // Singleton instance
  static getInstance() {
    if (!globalFileServiceInstance) {
      globalFileServiceInstance = new GoogleDriveFileService();
    }
    return globalFileServiceInstance;
  }

  // Initialize the service
  async initialize() {
    if (!globalFileServiceInitialized) {
      this.initialized = await this.driveService.initialize();
      globalFileServiceInitialized = this.initialized;
    } else {
      console.log('✅ [Cache] GoogleDriveFileService already initialized globally, skipping');
      this.initialized = true;
    }
    return this.initialized;
  }

  // Helper method to ensure initialization
  async ensureInitialized() {
    // Check global state first to avoid redundant initialization
    if (!globalFileServiceInitialized) {
      await this.initialize();
    } else {
      // Update local state to match global state
      this.initialized = true;
    }
  }

  // Lightweight method to check if already initialized (for API routes that can skip init)
  isInitialized() {
    return globalFileServiceInitialized;
  }

  // Search for PDF files by filename or description
  async searchPDFFiles(query) {
    try {
      await this.ensureInitialized();
      
      // Search for PDF files
      const files = await this.driveService.searchFiles(
        `mimeType='application/pdf' and (name contains '${query}' or fullText contains '${query}')`
      );
      
      return files.map(file => ({
        id: file.id,
        name: file.name,
        size: file.size,
        createdTime: file.createdTime,
        modifiedTime: file.modifiedTime,
        webViewLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`
      }));
    } catch (error) {
      console.error('Error searching PDF files:', error);
      return [];
    }
  }

  // Get file details by ID
  async getFileById(fileId) {
    try {
      await this.ensureInitialized();
      return await this.driveService.getFileDetails(fileId);
    } catch (error) {
      console.error('Error getting file details:', error);
      return null;
    }
  }

  // Get view link for a file (opens in browser instead of downloading)
  async getViewLink(fileId) {
    try {
      await this.ensureInitialized();
      const file = await this.driveService.getFileDetails(fileId);
      
      if (!file) {
        return null;
      }

      // Generate view link to open in browser
      return `https://drive.google.com/file/d/${fileId}/view`;
    } catch (error) {
      console.error('Error generating view link:', error);
      return null;
    }
  }

  // Get direct download link for a file (kept for backward compatibility)
  async getDownloadLink(fileId) {
    try {
      await this.ensureInitialized();
      const file = await this.driveService.getFileDetails(fileId);
      
      if (!file) {
        return null;
      }

      // Generate authenticated download link using Google Drive API
      return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    } catch (error) {
      console.error('Error generating download link:', error);
      return null;
    }
  }

  // Get all PDF files (for indexing/search)
  async getAllPDFFiles(folderId = null) {
    try {
      await this.ensureInitialized();
      
      const query = folderId 
        ? `'${folderId}' in parents and mimeType='application/pdf' and trashed=false`
        : `mimeType='application/pdf' and trashed=false`;
      
      const files = await this.driveService.searchFiles(query);
      
      return files.map(file => ({
        id: file.id,
        name: file.name,
        size: file.size,
        createdTime: file.createdTime,
        modifiedTime: file.modifiedTime,
        parents: file.parents
      }));
    } catch (error) {
      console.error('Error getting all PDF files:', error);
      return [];
    }
  }

  // Search files by IB paper criteria using the specific folder structure
  async searchIBPapers(year, month, subject, level, paper, group = null) {
    try {
      await this.ensureInitialized();
      
      console.log(`🔍 Searching for IB papers: ${subject} ${level} ${month} ${year} Paper ${paper}`);
      
      // Use the proper folder navigation method instead of searching for month/year in file names
      const files = await this.searchInYearMonthFolder(year, month, subject, level, paper, null, group);
      
      console.log(`📊 searchInYearMonthFolder returned ${files.length} files`);
      
      return files;
      
    } catch (error) {
      console.error('Error searching IB papers:', error);
      return [];
    }
  }

  // Search for files within the specific year and month folders
  async searchInYearMonthFolder(year, month, subject = null, level = null, paper = null, language = null, group = null) {
    const startTime = Date.now();
    try {
      await this.ensureInitialized();
      
      const targetFolderId = process.env.TARGET_FOLDER_ID;
      if (!targetFolderId) {
        console.error('TARGET_FOLDER_ID not found in environment variables');
        return [];
      }

      // Navigate directly to the specific group folder: TARGET_FOLDER_ID -> YEAR -> MONTH -> GROUP
      const groupFolder = await this.getGroupFolder(year, month, group);
      if (!groupFolder) {
        console.log(`🔍 Group folder '${group}' not found in ${year} ${month}`);
        return [];
      }

      console.log(`🔍 Found group folder: ${groupFolder.name} (ID: ${groupFolder.id})`);
      
      let allFiles = [];
      
      // Check if we're looking for audio files (Group Ex - Audio)
      const isAudioGroup = group === 'Group Ex - Audio';
      
      if (isAudioGroup && subject) {
        console.log(`🔍 Searching for audio files in: ${groupFolder.name}`);
        
        // Search for MP3 files instead of PDF files
        let searchQuery = `'${groupFolder.id}' in parents and (mimeType='audio/mpeg' or mimeType='audio/mp3' or name contains '.mp3') and trashed=false`;
        
        // Add subject filter for audio files
        if (subject) {
          searchQuery += ` and name contains '${subject}'`;
          console.log(`🔍 Searching for audio subject: ${subject}`);
        }
        
        console.log(`🔍 Final audio search query: ${searchQuery}`);
        const files = await this.driveService.searchFiles(searchQuery);
        console.log(`🔍 Found ${files.length} audio files in ${groupFolder.name}`);
        
        if (files.length > 0) {
          console.log(`Found ${files.length} audio files in ${groupFolder.name}`);
          
          // Map audio files with proper type
          const audioFiles = files.map(file => ({
            id: file.id,
            name: file.name,
            size: file.size,
            createdTime: file.createdTime,
            modifiedTime: file.modifiedTime,
            webViewLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
            type: 'audio'
          }));
          
          allFiles.push(...audioFiles);
        }
      } else {
        // For regular groups, search for PDF files in the specific group folder
        console.log(`🔍 Searching for PDF files in: ${groupFolder.name}`);
        
        const subjectFolder = groupFolder;
        let searchQuery = `'${subjectFolder.id}' in parents and mimeType='application/pdf' and trashed=false`;
        
        console.log(`🔍 Searching in folder: ${subjectFolder.name}`);
        
        if (subject) {
          // For subjects with A/B variants, be more specific
          const subjectLower = subject.toLowerCase();
          if (this.hasSubjectVariants(subjectLower)) {
            if (subjectLower.includes(' b')) {
              // For B variant, search only for B variants - be more strict about language matching
              const baseSubject = subjectLower.replace(/\s*[ab]\s*$/i, '').trim();
              // Use more specific search patterns that require the language to be at the start
              searchQuery += ` and (name contains '${baseSubject}_B_' or name contains '${baseSubject} B ' or name contains '${baseSubject}_b_' or name contains '${baseSubject} b ')`;
              console.log(`🔍 Searching for B variant: ${baseSubject}_B_, ${baseSubject} B , ${baseSubject}_b_, ${baseSubject} b `);
            } else if (subjectLower.includes(' a')) {
              // For A variant, search only for A variants - be more strict about language matching
              const baseSubject = subjectLower.replace(/\s*[ab]\s*$/i, '').trim();
              // Use more specific search patterns that require the language to be at the start
              searchQuery += ` and (name contains '${baseSubject}_A_' or name contains '${baseSubject} A ' or name contains '${baseSubject}_a_' or name contains '${baseSubject} a ')`;
              console.log(`🔍 Searching for A variant: ${baseSubject}_A_, ${baseSubject} A , ${baseSubject}_a_, ${baseSubject} a `);
            } else {
              // Just the subject name - search for both but we'll filter later
              const baseSubject = subjectLower.replace(/\s*[ab]\s*$/i, '').trim();
              // Make search case-insensitive by searching for both lowercase and proper case
              searchQuery += ` and (name contains '${baseSubject}' or name contains '${baseSubject.charAt(0).toUpperCase() + baseSubject.slice(1)}')`;
              console.log(`🔍 Searching for base subject: ${baseSubject} (case-insensitive)`);
            }
          } else {
            // Make search case-insensitive for non-variant subjects
            const subjectProperCase = subject.charAt(0).toUpperCase() + subject.slice(1).toLowerCase();
            searchQuery += ` and (name contains '${subject}' or name contains '${subjectProperCase}')`;
            console.log(`🔍 Searching for subject: ${subject} (case-insensitive)`);
          }
        }
        if (level) {
          // Default behavior: Search for both the requested level AND HLSL for all groups
          // Exception: Group Ex - Audio doesn't have levels in filenames
          if (group && group.includes('Group Ex - Audio')) {
            // Audio files don't have levels, so skip level filtering
            console.log(`🔍 Skipping level filter for Group Ex - Audio`);
            } else {
            // For all other groups, search for both the specific level AND HLSL
            if (level === 'HL' || level === 'SL') {
              searchQuery += ` and (name contains '${level}' or name contains 'HLSL')`;
              console.log(`🔍 Adding level filter: ${level} and HLSL (default behavior)`);
            } else {
              searchQuery += ` and name contains '${level}'`;
              console.log(`🔍 Adding level filter: ${level}`);
            }
          }
        }
        if (paper) {
          // Special handling for Group 2 Paper 2 - don't filter by paper pattern
          // to allow both reading and listening comprehension files to be found
          const isGroup2Paper2 = group === 'Group 2 - Language Acquisition' && paper === '2';
          
          // Special handling for Group 6 Music - don't filter by paper pattern
          // Music files don't have paper numbers, so we skip paper filtering
          const isGroup6Music = group && group.includes('The Arts') && subject && subject.toLowerCase() === 'music';
          
          if (isGroup2Paper2) {
            console.log(`🔍 Group 2 Paper 2 detected - skipping paper filter to allow dual search`);
          } else if (isGroup6Music) {
            console.log(`🔍 Group 6 Music detected - skipping paper filter (Music files don't have paper numbers)`);
          } else {
            // More flexible paper search to match various naming patterns
            const paperPatterns = [
              `Paper ${paper}`,
              `paper_${paper}`,
              `paper ${paper}`,
              `Paper_${paper}`
            ];
            const paperQuery = paperPatterns.map(pattern => `name contains '${pattern}'`).join(' or ');
            searchQuery += ` and (${paperQuery})`;
            console.log(`🔍 Adding paper filter: ${paperQuery}`);
          }
        }

        console.log(`🔍 Final search query: ${searchQuery}`);
        const files = await this.driveService.searchFiles(searchQuery);
        console.log(`🔍 Found ${files.length} files in ${subjectFolder.name}`);
        
        if (files.length > 0) {
          console.log(`Found ${files.length} files in ${subjectFolder.name}`);
          
          // Filter files based on language preference
          let filteredFiles = files;
          if (!language) {
            // For language subjects (Groups 1 & 2), don't filter by English - include all language variants
            // For other subjects, prioritize English files (no language suffix)
            if (group && (group.includes('Language') || group.includes('Studies in Language'))) {
              console.log(`🔍 Language subject detected, keeping all language variants`);
              filteredFiles = files; // Keep all files for language subjects
            } else {
              // Default: prioritize English files (no language suffix) for non-language subjects
              filteredFiles = this.filterEnglishFiles(files);
            }
          } else if (language !== 'English') {
            // Specific language requested
            filteredFiles = files.filter(file => 
              file.name.toLowerCase().includes(language.toLowerCase())
            );
          }
          
                     // Apply subject filtering to ensure exact matches
           if (subject && this.hasSubjectVariants(subject.toLowerCase())) {
             console.log(`Before subject filtering: ${filteredFiles.length} files`);
             filteredFiles = this.filterSubjectVariants(filteredFiles, subject);
             console.log(`After subject filtering: ${filteredFiles.length} files`);
           }
          
          // Apply paper filtering to respect the exact paper number requested
          filteredFiles = this.filterFilesByPaper(filteredFiles, paper);
          
          if (filteredFiles.length > 0) {
            allFiles.push(...filteredFiles);
          }
        }
      }
      
      // If this is a Language B Paper 2 request from 2022 onwards, also search for audio files
      if (paper === '2' && year && parseInt(year) >= 2022 && subject && this.isLanguageBSubject(subject.toLowerCase())) {
        console.log(`🎧 Searching for audio files for Language B Paper 2 request: ${subject} ${level} ${month} ${year}`);
        
        // Try primary audio search first
        let audioFiles = await this.searchAudioFilesForLanguageB(year, month, subject, level, paper);
        
        if (audioFiles.length > 0) {
          console.log(`🎧 Primary search found ${audioFiles.length} audio files to include`);
          allFiles.push(...audioFiles);
        } else {
          console.log(`🎧 Primary audio search failed, trying broader search...`);
          
          // Try broader audio search
          audioFiles = await this.searchBroaderAudioFiles(year, month, subject, level);
          
          if (audioFiles.length > 0) {
            console.log(`🎧 Broader search found ${audioFiles.length} audio files to include`);
            allFiles.push(...audioFiles);
          } else {
            console.log(`🎧 Broader search also failed, trying any available audio files...`);
            
            // Try searching for any available audio files for this language/level
            audioFiles = await this.searchAnyAudioFiles(subject, level);
            
            if (audioFiles.length > 0) {
              console.log(`🎧 Found ${audioFiles.length} audio files from any available sources`);
              allFiles.push(...audioFiles);
            } else {
              console.log(`🎧 No audio files found from any search method`);
            }
          }
        }
        
        // Also do a broader search specifically for Language B Paper 2 files
        // BUT skip this for Group 2 Paper 2 to avoid filtering out listening comprehension files
        const isGroup2Paper2 = group === 'Group 2 - Language Acquisition' && paper === '2';
        
        if (!isGroup2Paper2) {
          console.log(`🔍 Doing additional broad search for Language B Paper 2 files`);
          const additionalFiles = await this.searchLanguageBPaper2Files(year, month, subject, level);
          if (additionalFiles.length > 0) {
            console.log(`🔍 Found ${additionalFiles.length} additional Language B Paper 2 files`);
            // Only add files that aren't already in the list
            const newFiles = additionalFiles.filter(newFile => 
              !allFiles.some(existingFile => existingFile.id === newFile.id)
            );
            if (newFiles.length > 0) {
              console.log(`🔍 Adding ${newFiles.length} new Language B Paper 2 files`);
              allFiles.push(...newFiles);
            }
          }
        } else {
          console.log(`🔍 Skipping additional Language B Paper 2 search for Group 2 Paper 2 to preserve listening comprehension files`);
        }
      }
      
      console.log(`📊 Total files found (PDFs + Audio): ${allFiles.length}`);
      console.log(`📄 PDF files: ${allFiles.filter(f => !f.type || f.type !== 'audio').length}`);
      console.log(`🎧 Audio files: ${allFiles.filter(f => f.type === 'audio').length}`);
      
      // Debug: Check for listening files specifically
      const listeningFiles = allFiles.filter(file => file.name.toLowerCase().includes('listening'));
      console.log(`🔍 Listening files in final result: ${listeningFiles.length}`);
      if (listeningFiles.length > 0) {
        console.log('🎧 Listening files found:');
        listeningFiles.forEach(file => console.log(`  - ${file.name}`));
      }
      
      // Log all found files for debugging
      if (allFiles.length > 0) {
        console.log('\n📋 All found files:');
        allFiles.forEach((file, index) => {
          const fileType = file.type === 'audio' ? '🎧' : '📄';
          console.log(`  ${index + 1}. ${fileType} ${file.name}`);
        });
      }
      
      const result = allFiles.map(file => ({
        id: file.id,
        name: file.name,
        size: file.size,
        createdTime: file.createdTime,
        modifiedTime: file.modifiedTime,
        webViewLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
        type: file.type || 'pdf' // Preserve the type field for audio files
      }));
      
      const duration = Date.now() - startTime;
      console.log(`⚡ Search completed in ${duration}ms - Found ${result.length} files`);
      
      return result;
    } catch (error) {
      console.error('Error searching in year-month folder:', error);
      return [];
    }
  }

  // Filter files to prioritize English versions (no language suffix)
  filterEnglishFiles(files) {
    // Group files by their base name (without language suffix)
    const fileGroups = {};
    
    files.forEach(file => {
      // Extract base name by removing language suffixes
      const baseName = this.getBaseFileName(file.name);
      if (!fileGroups[baseName]) {
        fileGroups[baseName] = [];
      }
      fileGroups[baseName].push(file);
    });
    
    // For each group, prioritize English files
    const englishFiles = [];
    Object.values(fileGroups).forEach(group => {
      if (group.length === 1) {
        // Only one file in group, check if it's English
        const file = group[0];
        const name = file.name.toLowerCase();
        const hasLanguageSuffix = [
          'french', 'spanish', 'german', 'chinese', 'japanese', 'korean',
          'arabic', 'russian', 'portuguese', 'italian', 'dutch', 'swedish',
          'norwegian', 'danish', 'finnish', 'polish', 'czech', 'hungarian',
          'romanian', 'bulgarian', 'greek', 'turkish', 'hebrew', 'hindi',
          'bengali', 'thai', 'vietnamese', 'indonesian', 'malay', 'filipino'
        ].some(lang => name.includes(lang));
        
        if (!hasLanguageSuffix) {
          englishFiles.push(file);
        }
      } else {
        // Multiple files, find the English version
        const englishFile = this.findEnglishVersion(group);
        if (englishFile) {
          englishFiles.push(englishFile);
        }
      }
    });
    
    return englishFiles;
  }

  // Enhanced filtering that respects paper numbers
  filterFilesByPaper(files, requestedPaper) {
    if (!requestedPaper) return files;
    
    return files.filter(file => {
      const name = file.name.toLowerCase();
      
      // Check for exact paper number matches with more flexible patterns
      const paper1Match = name.includes('paper_1') || name.includes('paper 1') || name.includes('paper1');
      const paper2Match = name.includes('paper_2') || name.includes('paper 2') || name.includes('paper2');
      const paper3Match = name.includes('paper_3') || name.includes('paper 3') || name.includes('paper3');
      
      // For Language B Paper 2, also check for reading and listening comprehension files
      if (requestedPaper == 2) {
        const isReadingComprehension = name.includes('reading_comprehension') || name.includes('reading comprehension');
        const isListeningComprehension = name.includes('listening_comprehension') || name.includes('listening comprehension');
        return (paper2Match && !paper1Match && !paper3Match) || isReadingComprehension || isListeningComprehension;
      }
      
      // Only return files that match the requested paper exactly
      if (requestedPaper == 1) return paper1Match && !paper2Match && !paper3Match;
      if (requestedPaper == 3) return paper3Match && !paper1Match && !paper2Match;
      
      return true; // If no specific paper requested, return all
    });
  }

  // Filter subject files to ensure exact A vs B matches for all languages
  filterSubjectVariants(files, requestedSubject) {
    const subject = requestedSubject.toLowerCase();
    const subjectName = this.getSubjectName(subject);
    
    console.log(`Filtering for subject: "${requestedSubject}", base name: "${subjectName}"`);
    console.log(`Input files:`, files.map(f => f.name));
    
    if (subject.includes(' b')) {
      // Only return B variant files - be more strict about language matching
      const filtered = files.filter(file => {
        const name = file.name.toLowerCase();
        const subjectLower = subjectName.toLowerCase();
        const baseSubject = subjectLower.replace(/\s*[ab]\s*$/i, '').trim();
        
        // Check for various B variant patterns - must match the EXACT language
        const isB = (
          name.includes(`${baseSubject}_b`) || 
          name.includes(`${baseSubject} b`) ||
          name.includes(`${baseSubject}_B`) ||
          name.includes(`${baseSubject} B`)
        );
        
        // Check for various A variant patterns to exclude them
        const isA = (
          name.includes(`${baseSubject}_a`) || 
          name.includes(`${baseSubject} a`) ||
          name.includes(`${baseSubject}_A`) ||
          name.includes(`${baseSubject} A`)
        );
        
        // Additional check: ensure the language name appears at the beginning of the filename (case-insensitive)
        // This prevents "English B" from matching "Chinese_B" files
        const nameStartsWithLanguage = name.startsWith(baseSubject.toLowerCase()) || 
                                     name.startsWith(`${baseSubject.toLowerCase()}_`) ||
                                     name.startsWith(`${baseSubject.toLowerCase()} `) ||
                                     name.startsWith(baseSubject.charAt(0).toUpperCase() + baseSubject.slice(1)) ||
                                     name.startsWith(`${baseSubject.charAt(0).toUpperCase() + baseSubject.slice(1)}_`) ||
                                     name.startsWith(`${baseSubject.charAt(0).toUpperCase() + baseSubject.slice(1)} `);
        
        console.log(`File: ${file.name}, baseSubject: ${baseSubject}, isB: ${isB}, isA: ${isA}, startsWithLanguage: ${nameStartsWithLanguage}, including: ${isB && !isA && nameStartsWithLanguage}`);
        return isB && !isA && nameStartsWithLanguage;
      });
      console.log(`Filtered B files:`, filtered.map(f => f.name));
      return filtered;
    } else if (subject.includes(' a')) {
      // Only return A variant files - be more strict about language matching
      const filtered = files.filter(file => {
        const name = file.name.toLowerCase();
        const subjectLower = subjectName.toLowerCase();
        const baseSubject = subjectLower.replace(/\s*[ab]\s*$/i, '').trim();
        
        // Check for various A variant patterns - must match the EXACT language
        const isA = (
          name.includes(`${baseSubject}_a`) || 
          name.includes(`${baseSubject} a`) ||
          name.includes(`${baseSubject}_A`) ||
          name.includes(`${baseSubject} A`)
        );
        
        // Check for various B variant patterns to exclude them
        const isB = (
          name.includes(`${baseSubject}_b`) || 
          name.includes(`${baseSubject} b`) ||
          name.includes(`${baseSubject}_B`) ||
          name.includes(`${baseSubject} B`)
        );
        
        // Additional check: ensure the language name appears at the beginning of the filename (case-insensitive)
        const nameStartsWithLanguage = name.startsWith(baseSubject.toLowerCase()) || 
                                     name.startsWith(`${baseSubject.toLowerCase()}_`) ||
                                     name.startsWith(`${baseSubject.toLowerCase()} `) ||
                                     name.startsWith(baseSubject.charAt(0).toUpperCase() + baseSubject.slice(1)) ||
                                     name.startsWith(`${baseSubject.charAt(0).toUpperCase() + baseSubject.slice(1)}_`) ||
                                     name.startsWith(`${baseSubject.charAt(0).toUpperCase() + baseSubject.slice(1)} `);
        
        console.log(`File: ${file.name}, baseSubject: ${baseSubject}, isA: ${isA}, isB: ${isB}, startsWithLanguage: ${nameStartsWithLanguage}, including: ${isA && !isB && nameStartsWithLanguage}`);
        return isA && !isB && nameStartsWithLanguage;
      });
      console.log(`Filtered A files:`, filtered.map(f => f.name));
      return filtered;
    }
    
    // If just the subject name was requested, return all files for that subject
    console.log(`No variant specified, returning all files`);
    return files;
  }

  // Check if a subject has A/B variants
  hasSubjectVariants(subject) {
    const subjectsWithVariants = [
      'english', 'french', 'spanish', 'german', 'chinese', 'japanese', 'korean',
      'arabic', 'russian', 'portuguese', 'italian', 'dutch', 'swedish',
      'norwegian', 'danish', 'finnish', 'polish', 'czech', 'hungarian',
      'romanian', 'bulgarian', 'greek', 'turkish', 'hebrew', 'hindi',
      'bengali', 'thai', 'vietnamese', 'indonesian', 'malay', 'filipino'
    ];
    
    return subjectsWithVariants.some(s => subject.includes(s));
  }

  // Extract the base subject name from a subject with variant
  getSubjectName(subject) {
    // For filtering purposes, we need to preserve the A/B variant
    // So "English B" should return "English B", not just "English"
    return subject.trim();
  }

  // Get base filename without language suffix
  getBaseFileName(filename) {
    // Remove common language suffixes (handle both single and double underscores)
    const languageSuffixes = [
      '_French', '_Spanish', '_German', '_Chinese', '_Japanese', '_Korean',
      '_Arabic', '_Russian', '_Portuguese', '_Italian', '_Dutch', '_Swedish',
      '_Norwegian', '_Danish', '_Finnish', '_Polish', '_Czech', '_Hungarian',
      '_Romanian', '_Bulgarian', '_Greek', '_Turkish', '_Hebrew', '_Hindi',
      '_Bengali', '_Thai', '_Vietnamese', '_Indonesian', '_Malay', '_Filipino',
      '__French', '__Spanish', '__German', '__Chinese', '__Japanese', '__Korean',
      '__Arabic', '__Russian', '__Portuguese', '__Italian', '__Dutch', '__Swedish',
      '__Norwegian', '__Danish', '__Finnish', '__Polish', '__Czech', '__Hungarian',
      '__Romanian', '__Bulgarian', '__Greek', '__Turkish', '__Hebrew', '__Hindi',
      '__Bengali', '__Thai', '__Vietnamese', '__Indonesian', '__Malay', '__Filipino'
    ];
    
    let baseName = filename;
    for (const suffix of languageSuffixes) {
      if (baseName.includes(suffix)) {
        baseName = baseName.replace(suffix, '');
        break;
      }
    }
    
    // Also remove file extensions for better grouping
    baseName = baseName.replace(/\.pdf$/i, '');
    
    return baseName;
  }

  // Find English version of a file (no language suffix)
  findEnglishVersion(files) {
    // First, try to find files without language suffixes
    const englishFiles = files.filter(file => {
      const name = file.name.toLowerCase();
      const hasLanguageSuffix = [
        'french', 'spanish', 'german', 'chinese', 'japanese', 'korean',
        'arabic', 'russian', 'portuguese', 'italian', 'dutch', 'swedish',
        'norwegian', 'danish', 'finnish', 'polish', 'czech', 'hungarian',
        'romanian', 'bulgarian', 'greek', 'turkish', 'hebrew', 'hindi',
        'bengali', 'thai', 'vietnamese', 'indonesian', 'malay', 'filipino'
      ].some(lang => name.includes(lang));
      
      return !hasLanguageSuffix;
    });
    
    if (englishFiles.length > 0) {
      // If multiple English files, prefer the one without TZ suffix first
      const nonTzFiles = englishFiles.filter(file => !file.name.includes('TZ'));
      if (nonTzFiles.length > 0) {
        return nonTzFiles[0];
      }
      return englishFiles[0];
    }
    
    // If no English files found, don't return any file
    // This ensures we only show English files by default
    return null;
  }

  // Get all available years from the target folder
  async getAvailableYears() {
    try {
      await this.ensureInitialized();
      
      // Return cached data if available
      if (this.cache.years) {
        console.log(`🔍 Using cached years: ${this.cache.years.length} years`);
        return this.cache.years;
      }
      
      const targetFolderId = process.env.TARGET_FOLDER_ID;
      if (!targetFolderId) {
        console.error('TARGET_FOLDER_ID not found in environment variables');
        return [];
      }

      // Now folders are simply named with the year (e.g., "2010", "2011", etc.)
      const yearFolders = await this.driveService.searchFiles(
        `'${targetFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and name matches '^\\d{4}$'`
      );

      const years = yearFolders
        .map(folder => parseInt(folder.name))
        .filter(year => !isNaN(year) && year >= 2010 && year <= 2025)
        .sort((a, b) => b - a); // Sort descending (newest first)

      // Cache the result
      this.cache.years = years;
      console.log(`🔍 Found ${years.length} year folders:`, years);
      return years;
    } catch (error) {
      console.error('Error getting available years:', error);
      return [];
    }
  }

  // Get available months for a specific year
  async getAvailableMonths(year) {
    try {
      await this.ensureInitialized();
      
      // Return cached data if available
      if (this.cache.months.has(year)) {
        console.log(`🔍 Using cached months for ${year}:`, this.cache.months.get(year));
        return this.cache.months.get(year);
      }
      
      const targetFolderId = process.env.TARGET_FOLDER_ID;
      if (!targetFolderId) {
        console.error('TARGET_FOLDER_ID not found in environment variables');
        return [];
      }

      // Find the year folder (now simply named with the year)
      const yearFolders = await this.driveService.searchFiles(
        `'${targetFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and name='${year}'`
      );

      if (yearFolders.length === 0) {
        console.log(`🔍 Year folder '${year}' not found`);
        return [];
      }

      const yearFolderId = yearFolders[0].id;
      console.log(`🔍 Found year folder: ${year} (ID: ${yearFolderId})`);

      // Find month folders within the year folder (now simply named "May" and "November")
      const monthFolders = await this.driveService.searchFiles(
        `'${yearFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and (name='May' or name='November')`
      );

      const months = monthFolders
        .map(folder => folder.name)
        .sort(); // Sort alphabetically (May, November)

      // Cache the result
      this.cache.months.set(year, months);
      console.log(`🔍 Found ${months.length} month folders for ${year}:`, months);
      return months;
    } catch (error) {
      console.error('Error getting available months:', error);
      return [];
    }
  }

  // Get specific group folder for a year/month/group combination
  async getGroupFolder(year, month, group) {
    try {
      await this.ensureInitialized();
      
      const targetFolderId = process.env.TARGET_FOLDER_ID;
      if (!targetFolderId) {
        console.error('TARGET_FOLDER_ID not found in environment variables');
        return null;
      }

      // Create cache key
      const cacheKey = `${year}-${month}-${group}`;
      
      // Return cached result if available
      if (this.cache.folderIds.has(cacheKey)) {
        const cached = this.cache.folderIds.get(cacheKey);
        console.log(`🔍 Using cached group folder: ${group} (ID: ${cached.id})`);
        return cached;
      }

      console.log(`🔍 Getting group folder for ${year} ${month} ${group}`);

      // Navigate through the simplified folder structure: TARGET_FOLDER_ID -> YEAR -> MONTH -> GROUP
      const yearFolders = await this.driveService.searchFiles(
        `'${targetFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and name='${year}'`
      );

      if (yearFolders.length === 0) {
        console.log(`🔍 Year folder '${year}' not found`);
        return null;
      }

      const yearFolderId = yearFolders[0].id;

      // Find the month folder within the year folder
      const monthFolders = await this.driveService.searchFiles(
        `'${yearFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and name='${month}'`
      );

      if (monthFolders.length === 0) {
        console.log(`🔍 Month folder '${month}' not found in year ${year}`);
        return null;
      }

      const monthFolderId = monthFolders[0].id;

      // Find the specific group folder within the month folder
      const groupFolders = await this.driveService.searchFiles(
        `'${monthFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and name='${group}'`
      );

      if (groupFolders.length === 0) {
        console.log(`🔍 Group folder '${group}' not found in ${year} ${month}`);
        return null;
      }

      const groupFolder = groupFolders[0];
      const result = {
        id: groupFolder.id,
        name: groupFolder.name,
        mimeType: groupFolder.mimeType
      };
      
      // Cache the result
      this.cache.folderIds.set(cacheKey, result);
      console.log(`🔍 Found and cached group folder: ${group} (ID: ${groupFolder.id})`);
      
      return result;
    } catch (error) {
      console.error('Error getting group folder:', error);
      return null;
    }
  }

  // Get available groups for a specific year-month
  async getAvailableGroups(year, month) {
    try {
      await this.ensureInitialized();
      
      const subjectFolders = await this.getSubjectFolders(year, month);
      return subjectFolders.map(folder => folder.name);
    } catch (error) {
      console.error('Error getting available groups:', error);
      return [];
    }
  }

  // Get subject folders for a specific month-year
  async getSubjectFolders(year, month) {
    try {
      await this.ensureInitialized();
      
      const targetFolderId = process.env.TARGET_FOLDER_ID;
      if (!targetFolderId) {
        console.error('TARGET_FOLDER_ID not found in environment variables');
        return [];
      }

      // Create cache key
      const cacheKey = `subjectFolders-${year}-${month}`;
      
      // Return cached result if available
      if (this.cache.folderIds.has(cacheKey)) {
        const cached = this.cache.folderIds.get(cacheKey);
        console.log(`🔍 Using cached subject folders for ${year} ${month}: ${cached.length} folders`);
        return cached;
      }

      console.log(`🔍 Getting subject folders for ${year} ${month}`);

      // Navigate through the simplified folder structure: TARGET_FOLDER_ID -> YEAR -> MONTH
      const yearFolders = await this.driveService.searchFiles(
        `'${targetFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and name='${year}'`
      );

      if (yearFolders.length === 0) {
        console.log(`🔍 Year folder '${year}' not found`);
        return [];
      }

      const yearFolderId = yearFolders[0].id;

      // Find the month folder within the year folder
      const monthFolders = await this.driveService.searchFiles(
        `'${yearFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and name='${month}'`
      );

      if (monthFolders.length === 0) {
        console.log(`🔍 Month folder '${month}' not found in year ${year}`);
        return [];
      }

      const monthFolderId = monthFolders[0].id;

      // Get all subject folders within the month folder
      const subjectFolders = await this.driveService.searchFiles(
        `'${monthFolderId}' in parents and mimeType='application/vnd.google-apps.folder'`
      );

      const result = subjectFolders.map(folder => ({
        id: folder.id,
        name: folder.name,
        mimeType: folder.mimeType
      }));
      
      // Cache the result
      this.cache.folderIds.set(cacheKey, result);
      console.log(`🔍 Found and cached ${result.length} subject folders in ${year} ${month}`);
      
      return result;
    } catch (error) {
      console.error('Error getting subject folders:', error);
      return [];
    }
  }

  // Search for audio files specifically for Language B Paper 2
  async searchAudioFilesForLanguageB(year, month, subject, level, paper) {
    try {
      const targetFolderId = process.env.TARGET_FOLDER_ID;
      if (!targetFolderId) {
        console.error('TARGET_FOLDER_ID not found in environment variables');
        return [];
      }

      console.log(`🎧 Searching for audio files: ${subject} ${level} ${month} ${year}`);

      // First, find the year folder within the target folder
      const yearFolders = await this.driveService.searchFiles(
        `'${targetFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and name contains '${year} Examination Session'`
      );

      if (yearFolders.length === 0) {
        console.log(`No year folder found for ${year}`);
        return [];
      }

      const yearFolderId = yearFolders[0].id;

      // Then, find the month-year folder within the year folder
      const monthYearFolders = await this.driveService.searchFiles(
        `'${yearFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and name contains '${month} ${year} Examination Session'`
      );

      if (monthYearFolders.length === 0) {
        console.log(`No month-year folder found for ${month} ${year}`);
        return [];
      }

      const monthYearFolderId = monthYearFolders[0].id;

      // Find the "Group Ex - Audio" folder
      const audioFolders = await this.driveService.searchFiles(
        `'${monthYearFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and name contains 'Group Ex - Audio'`
      );

      if (audioFolders.length === 0) {
        console.log(`No Group Ex - Audio folder found in ${month} ${year} Examination Session`);
        return [];
      }

      const audioFolderId = audioFolders[0].id;
      console.log(`🎧 Found Group Ex - Audio folder: ${audioFolderId}`);

      // Extract language name and level for audio file search
      const languageName = this.extractLanguageName(subject);
      const audioLevel = level === 'HL' ? 'HL' : 'SL'; // Language B can be HL or SL, ab_initio is always SL
      
      // Build search query for audio files
      // New format: [language]_B_[level].mp3 or [language]_ab_initio_[level].mp3
      // Examples: Japanese_B_HL.mp3, Arabic_ab_initio_SL.mp3
      
      // Search for both Language B and ab_initio audio files
      const searchQuery = `'${audioFolderId}' in parents and trashed=false and (name contains '${languageName}_B_${audioLevel}' or name contains '${languageName}_ab_initio_${audioLevel}')`;
      
      console.log(`🎧 Audio search query: ${searchQuery}`);
      
      const audioFiles = await this.driveService.searchFiles(searchQuery);
      
      console.log(`🎧 Found ${audioFiles.length} audio files for ${languageName} ${audioLevel} in ${month} ${year}`);
      
      if (audioFiles.length > 0) {
        audioFiles.forEach(file => {
          console.log(`🎧 Audio file: ${file.name}`);
        });
      }
      
      return audioFiles.map(file => ({
        id: file.id,
        name: file.name,
        size: file.size,
        createdTime: file.createdTime,
        modifiedTime: file.modifiedTime,
        webViewLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
        type: 'audio'
      }));
    } catch (error) {
      console.error('Error searching for audio files:', error);
      return [];
    }
  }

  // Broader audio file search when primary search fails
  async searchBroaderAudioFiles(year, month, subject, level) {
    try {
      const targetFolderId = process.env.TARGET_FOLDER_ID;
      if (!targetFolderId) {
        console.error('TARGET_FOLDER_ID not found in environment variables');
        return [];
      }

      console.log(`🎧 Trying broader audio search for: ${subject} ${level} ${month} ${year}`);

      // First, find the year folder within the target folder
      const yearFolders = await this.driveService.searchFiles(
        `'${targetFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and name contains '${year} Examination Session'`
      );

      if (yearFolders.length === 0) {
        console.log(`No year folder found for ${year}`);
        return [];
      }

      const yearFolderId = yearFolders[0].id;

      // Then, find the month-year folder within the year folder
      const monthYearFolders = await this.driveService.searchFiles(
        `'${yearFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and name contains '${month} ${year} Examination Session'`
      );

      if (monthYearFolders.length === 0) {
        console.log(`No month-year folder found for ${month} ${year}`);
        return [];
      }

      const monthYearFolderId = monthYearFolders[0].id;

      // Find the "Group Ex - Audio" folder
      const audioFolders = await this.driveService.searchFiles(
        `'${monthYearFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and name contains 'Group Ex - Audio'`
      );

      if (audioFolders.length === 0) {
        console.log(`No Group Ex - Audio folder found in ${month} ${year} Examination Session`);
        return [];
      }

      const audioFolderId = audioFolders[0].id;

      // Extract language name and level for audio file search
      const languageName = this.extractLanguageName(subject);
      const audioLevel = level === 'HL' ? 'HL' : 'SL';
      
      // Build a more flexible search query for audio files
      // Look for any audio files that contain the language name and level in the new format
      const searchQuery = `'${audioFolderId}' in parents and trashed=false and (name contains '${languageName}_B_${audioLevel}' or name contains '${languageName}_ab_initio_${audioLevel}')`;
      
      console.log(`🎧 Broader audio search query: ${searchQuery}`);
      
      const audioFiles = await this.driveService.searchFiles(searchQuery);
      
      console.log(`🎧 Broader search found ${audioFiles.length} audio files for ${languageName} ${audioLevel} in ${month} ${year}`);
      
      if (audioFiles.length > 0) {
        audioFiles.forEach(file => {
          console.log(`🎧 Broader search audio file: ${file.name}`);
        });
      }
      
      return audioFiles.map(file => ({
        id: file.id,
        name: file.name,
        size: file.size,
        createdTime: file.createdTime,
        modifiedTime: file.modifiedTime,
        webViewLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
        type: 'audio'
      }));
    } catch (error) {
      console.error('Error in broader audio search:', error);
      return [];
    }
  }

  // Search for audio files in any available year/month combinations
  async searchAnyAudioFiles(subject, level) {
    try {
      const targetFolderId = process.env.TARGET_FOLDER_ID;
      if (!targetFolderId) {
        console.error('TARGET_FOLDER_ID not found in environment variables');
        return [];
      }

      console.log(`🎧 Searching for any audio files: ${subject} ${level}`);

      // Extract language name and level for audio file search
      const languageName = this.extractLanguageName(subject);
      const audioLevel = level === 'HL' ? 'HL' : 'SL';
      
      // Search for any audio files that contain the language name and level in the new format
      // This will search across all folders in the target directory
      const searchQuery = `'${targetFolderId}' in parents and trashed=false and ((name contains '${languageName}_B_${audioLevel}' or name contains '${languageName}_ab_initio_${audioLevel}') and (mimeType contains 'audio' or mimeType contains 'mp3' or mimeType contains 'wav' or mimeType contains 'm4a'))`;
      
      console.log(`🎧 Any audio search query: ${searchQuery}`);
      
      const audioFiles = await this.driveService.searchFiles(searchQuery);
      
      console.log(`🎧 Any audio search found ${audioFiles.length} audio files for ${languageName} ${audioLevel}`);
      
      if (audioFiles.length > 0) {
        audioFiles.forEach(file => {
          console.log(`🎧 Any audio file: ${file.name}`);
        });
      }
      
      return audioFiles.map(file => ({
        id: file.id,
        name: file.name,
        size: file.size,
        createdTime: file.createdTime,
        modifiedTime: file.modifiedTime,
        webViewLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
        type: 'audio'
      }));
    } catch (error) {
      console.error('Error in any audio search:', error);
      return [];
    }
  }

  // Check if a subject is a Language B or ab_initio subject
  isLanguageBSubject(subject) {
    const languageBSubjects = [
      'english b', 'french b', 'spanish b', 'german b', 'chinese b', 'japanese b', 'korean b',
      'arabic b', 'russian b', 'portuguese b', 'italian b', 'dutch b', 'swedish b',
      'norwegian b', 'danish b', 'finnish b', 'polish b', 'czech b', 'hungarian b',
      'romanian b', 'bulgarian b', 'greek b', 'turkish b', 'hebrew b', 'hindi b',
      'bengali b', 'thai b', 'vietnamese b', 'indonesian b', 'malay b', 'filipino b',
      'eng b', 'fr b', 'sp b', 'ger b', 'chi b', 'jap b', 'kor b', 'ara b', 'rus b',
      'por b', 'ita b', 'dut b', 'swe b', 'nor b', 'dan b', 'fin b', 'pol b', 'cze b',
      'hun b', 'rom b', 'bul b', 'gre b', 'tur b', 'heb b', 'hin b', 'ben b', 'tha b',
      'vie b', 'ind b', 'may b', 'fil b'
    ];
    
    const abInitioSubjects = [
      'english ab_initio', 'french ab_initio', 'spanish ab_initio', 'german ab_initio', 'chinese ab_initio', 'japanese ab_initio', 'korean ab_initio',
      'arabic ab_initio', 'russian ab_initio', 'portuguese ab_initio', 'italian ab_initio', 'dutch ab_initio', 'swedish ab_initio',
      'norwegian ab_initio', 'danish ab_initio', 'finnish ab_initio', 'polish ab_initio', 'czech ab_initio', 'hungarian ab_initio',
      'romanian ab_initio', 'bulgarian ab_initio', 'greek ab_initio', 'turkish ab_initio', 'hebrew ab_initio', 'hindi ab_initio',
      'bengali ab_initio', 'thai ab_initio', 'vietnamese ab_initio', 'indonesian ab_initio', 'malay ab_initio', 'filipino ab_initio',
      'eng ab_initio', 'fr ab_initio', 'sp ab_initio', 'ger ab_initio', 'chi ab_initio', 'jap ab_initio', 'kor ab_initio', 'ara ab_initio', 'rus ab_initio',
      'por ab_initio', 'ita ab_initio', 'dut ab_initio', 'swe ab_initio', 'nor ab_initio', 'dan ab_initio', 'fin ab_initio', 'pol ab_initio', 'cze ab_initio',
      'hun ab_initio', 'rom ab_initio', 'bul ab_initio', 'gre ab_initio', 'tur ab_initio', 'heb ab_initio', 'hin ab_initio', 'ben ab_initio', 'tha ab_initio',
      'vie ab_initio', 'ind ab_initio', 'may ab_initio', 'fil ab_initio'
    ];
    
    const subjectLower = subject.toLowerCase();
    return languageBSubjects.includes(subjectLower) || abInitioSubjects.includes(subjectLower);
  }

  // Extract language name from subject (remove "B" or "ab_initio" suffix and normalize)
  extractLanguageName(subject) {
    let languageName = subject;
    console.log(`🔍 [Audio] Original subject: "${subject}"`);
    
    // Remove "Language B" suffix first (e.g., "Chinese Language B" → "Chinese")
    languageName = languageName.replace(/\s+language\s+b\s*$/i, '').trim();
    console.log(`🔍 [Audio] After removing "Language B": "${languageName}"`);
    
    // Remove "ab_initio" suffix (e.g., "Arabic ab_initio" → "Arabic")
    languageName = languageName.replace(/\s+ab_initio\s*$/i, '').trim();
    console.log(`🔍 [Audio] After removing "ab_initio": "${languageName}"`);
    
    // Then remove just "B" suffix (e.g., "English B" → "English")
    languageName = languageName.replace(/\s+b\s*$/i, '').trim();
    console.log(`🔍 [Audio] After removing "B": "${languageName}"`);
    
    // Map common abbreviations to full names for audio file matching
    const languageMap = {
      'eng': 'English',
      'fr': 'French', 
      'sp': 'Spanish',
      'ger': 'German',
      'chi': 'Chinese',
      'jap': 'Japanese',
      'kor': 'Korean',
      'ara': 'Arabic',
      'rus': 'Russian',
      'por': 'Portuguese',
      'ita': 'Italian',
      'dut': 'Dutch',
      'swe': 'Swedish',
      'nor': 'Norwegian',
      'dan': 'Danish',
      'fin': 'Finnish',
      'pol': 'Polish',
      'cze': 'Czech',
      'hun': 'Hungarian',
      'rom': 'Romanian',
      'bul': 'Bulgarian',
      'gre': 'Greek',
      'tur': 'Turkish',
      'heb': 'Hebrew',
      'hin': 'Hindi',
      'ben': 'Bengali',
      'tha': 'Thai',
      'vie': 'Vietnamese',
      'ind': 'Indonesian',
      'may': 'Malay',
      'fil': 'Filipino'
    };
    
    // Check if it's an abbreviation and convert to full name
    const lowerLanguage = languageName.toLowerCase();
    if (languageMap[lowerLanguage]) {
      console.log(`🔍 [Audio] Found abbreviation mapping: "${lowerLanguage}" → "${languageMap[lowerLanguage]}"`);
      return languageMap[lowerLanguage];
    }
    
    // Return the original language name (capitalized)
    const finalLanguageName = languageName.charAt(0).toUpperCase() + languageName.slice(1).toLowerCase();
    console.log(`🔍 [Audio] Final extracted language name: "${finalLanguageName}"`);
    return finalLanguageName;
  }

  // Search for Language B Paper 2 files specifically (reading comprehension, question booklet, text booklet, markscheme)
  async searchLanguageBPaper2Files(year, month, subject, level) {
    try {
      await this.ensureInitialized();
      
      const targetFolderId = process.env.TARGET_FOLDER_ID;
      if (!targetFolderId) {
        console.error('TARGET_FOLDER_ID not found in environment variables');
        return [];
      }

      // First, find the year folder
      const yearFolders = await this.driveService.searchFiles(
        `'${targetFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and name contains '${year} Examination Session'`
      );

      if (yearFolders.length === 0) {
        console.log(`No year folder found for ${year}`);
        return [];
      }

      const yearFolderId = yearFolders[0].id;

      // Then, find the month-year folder within the year folder
      const monthYearFolders = await this.driveService.searchFiles(
        `'${yearFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and name contains '${month} ${year} Examination Session'`
      );

      if (monthYearFolders.length === 0) {
        console.log(`No month-year folder found for ${month} ${year}`);
        return [];
      }

      const monthYearFolderId = monthYearFolders[0].id;

      // Find the "Group 2 - Language Acquisition" folder
      const group2Folders = await this.driveService.searchFiles(
        `'${monthYearFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and name contains 'Language Acquisition'`
      );

      if (group2Folders.length === 0) {
        console.log(`No Group 2 - Language Acquisition folder found in ${month} ${year} Examination Session`);
        return [];
      }

      const group2FolderId = group2Folders[0].id;

      // Extract language name and level for file search
      const languageName = this.extractLanguageName(subject);
      const fileLevel = level === 'HL' ? 'HL' : 'SL';
      
      // Build search patterns for Language B Paper 2 files - be more specific to the requested language
      const searchPatterns = [
        `name contains '${languageName}_B_paper_2'`,
        `name contains '${languageName} B paper 2'`,
        `name contains '${languageName}_B_paper2'`,
        `name contains '${languageName} B paper2'`
      ];
      
      // Only search for files that start with the specific language name
      const searchQuery = `'${group2FolderId}' in parents and mimeType='application/pdf' and trashed=false and (${searchPatterns.join(' or ')})`;
      
      console.log(`🔍 Language B Paper 2 search query: ${searchQuery}`);
      
      const files = await this.driveService.searchFiles(searchQuery);
      
      console.log(`Found ${files.length} Language B Paper 2 files for ${languageName} ${fileLevel} in ${month} ${year}`);
      
      // Filter files to ensure they match the requested level, are Paper 2 related, AND start with the specific language
      const filteredFiles = files.filter(file => {
        const name = file.name.toLowerCase();
        const languageNameLower = languageName.toLowerCase();
        
        // Must start with the specific language name (e.g., "english_b" not "chinese_b")
        const startsWithLanguage = name.startsWith(languageNameLower) || 
                                 name.startsWith(`${languageNameLower}_`) ||
                                 name.startsWith(`${languageNameLower} `);
        
        const matchesLevel = name.includes(fileLevel.toLowerCase());
        const isPaper2 = name.includes('paper_2') || name.includes('paper 2') || name.includes('reading_comprehension') || name.includes('reading comprehension') || name.includes('listening_comprehension') || name.includes('listening comprehension');
        
        const shouldInclude = startsWithLanguage && matchesLevel && isPaper2;
        console.log(`File: ${file.name}, startsWithLanguage: ${startsWithLanguage}, matchesLevel: ${matchesLevel}, isPaper2: ${isPaper2}, including: ${shouldInclude}`);
        
        return shouldInclude;
      });
      
      console.log(`Filtered to ${filteredFiles.length} relevant Language B Paper 2 files`);
      
      return filteredFiles.map(file => ({
        id: file.id,
        name: file.name,
        size: file.size,
        createdTime: file.createdTime,
        modifiedTime: file.modifiedTime,
        webViewLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
        type: 'pdf'
      }));
    } catch (error) {
      console.error('Error searching for Language B Paper 2 files:', error);
      return [];
    }
  }

  // Helper method to extract subject names from PDF filenames
  extractSubjectFromFilename(filename) {
    if (!filename || typeof filename !== 'string') {
      return null;
    }

    // Special pattern for Group 6 - The Arts (Music files ONLY)
    // Examples: "Music_HLSL_markscheme.pdf" → "Music"
    //           "Music_listening_paper_HL_Spanish.pdf" → "Music"
    //           "Music_score_booklet_HLSL.pdf" → "Music"
    //           "Music___HLSL_markscheme.pdf" → "Music" (triple underscore variant)
    // This pattern handles both single and triple underscore variants
    const group6MusicMatch = filename.match(/^(Music)(?:___|_)/);
    if (group6MusicMatch) {
      const subjectName = group6MusicMatch[1].trim();
      if (subjectName && subjectName.length > 0) {
        return subjectName;
      }
    }

    // Primary pattern: {Subject}_paper_{number}__{Timezone}_{Level}.pdf
    // Example: "Global_politics_paper_1__TZ1_SL.pdf" → "Global_politics"
    // Example: "Chemistry_paper_1__TZ1_SL.pdf" → "Chemistry"
    const primaryMatch = filename.match(/^(.+?)_paper_/);
    if (primaryMatch) {
      const subjectName = primaryMatch[1].trim();
      if (subjectName && subjectName.length > 0) {
        return subjectName;
      }
    }

    // Secondary pattern: {Subject}_paper_{number}_{Level}.pdf
    // Example: "Computer_Science_paper_2_HL.pdf" → "Computer_Science"
    // Example: "Biology_paper_2_HL.pdf" → "Biology"
    const secondaryMatch = filename.match(/^(.+?)_paper_\d+_([A-Z]+)/);
    if (secondaryMatch) {
      const subjectName = secondaryMatch[1].trim();
      if (subjectName && subjectName.length > 0) {
        return subjectName;
      }
    }

    // Fallback pattern: extract subject from beginning of filename
    // Look for common patterns in IB subject names
    const fallbackMatch = filename.match(/^([A-Za-z\s_]+?)(?:_|paper|HL|SL|TZ|\d|\.pdf)/);
    if (fallbackMatch) {
      const fallbackSubject = fallbackMatch[1].trim();
      if (fallbackSubject && 
          fallbackSubject.length > 0 && 
          !fallbackSubject.match(/^(paper|HL|SL|TZ|\d+)$/) &&
          fallbackSubject.length < 100) { // Increased length limit for multi-word subjects
        return fallbackSubject;
      }
    }

    return null;
  }

  // Helper method to check if a file belongs to Group 6 Music (VERY SPECIFIC)
  isGroup6MusicFile(filename) {
    if (!filename || typeof filename !== 'string') {
      return false;
    }
    // Check for Group 6 Music pattern ONLY: Music___... or Music_...
    // This is VERY specific and won't affect other Group 6 subjects
    return filename.match(/^(Music)(?:___|_)/) !== null;
  }

  // Helper method to parse Group 6 Music files (VERY SPECIFIC)
  parseGroup6MusicFile(filename, requestedLevel) {
    if (!filename || typeof filename !== 'string') {
      return null;
    }

    // Group 6 Music files don't have paper numbers, so we return all relevant files
    // Examples: 
    // - "Music_HLSL_markscheme.pdf" or "Music___HLSL_markscheme.pdf" → matches HL, SL, and HLSL
    // - "Music_listening_paper_HL_Spanish.pdf" or "Music___listening_paper_HL_Spanish.pdf" → matches HL only
    // - "Music_listening_paper_SL.pdf" or "Music___listening_paper_SL.pdf" → matches SL only
    // - "Music_score_booklet_HLSL.pdf" or "Music___score_booklet_HLSL.pdf" → matches HL, SL, and HLSL
    // This logic ONLY applies to Music files and won't affect other Group 6 subjects

    const fileName = filename.toLowerCase();
    
    // Check if file contains the requested level or HLSL (which matches both HL and SL)
    const hasRequestedLevel = fileName.includes(requestedLevel.toLowerCase());
    const hasHLSL = fileName.includes('hlsl');
    
    // For Group 6 Music, we want to include files that:
    // 1. Match the exact requested level (HL or SL)
    // 2. Have HLSL (which applies to both HL and SL)
    // 3. Don't have a specific level (default English files)
    
    if (hasRequestedLevel || hasHLSL) {
      return {
        filename: filename,
        level: requestedLevel,
        isRelevant: true
      };
    }
    
    return null;
  }

  // Extract subject names from MP3 filenames (for Group Ex - Audio)
  extractSubjectFromAudioFilename(filename) {
    if (!filename || typeof filename !== 'string') {
      return null;
    }

    // New pattern: [subject]_[B/ab_initio]_[level].mp3
    // Examples: Arabic_B_SL.mp3, Swedish_ab_initio_SL.mp3
    
    // Remove .mp3 extension first
    const nameWithoutExt = filename.replace(/\.mp3$/i, '');
    
    // Split by underscore to get parts
    const parts = nameWithoutExt.split('_');
    
    if (parts.length < 3) {
      console.log(`🔍 [Audio] Invalid audio filename format: ${filename}`);
      return null;
    }
    
    // Handle different patterns:
    // Pattern 1: [Subject]_B_[Level] (e.g., Arabic_B_SL)
    // Pattern 2: [Subject]_ab_initio_[Level] (e.g., Arabic_ab_initio_SL)
    
    let subject, type, level;
    
    if (parts[1] === 'B') {
      // Pattern 1: [Subject]_B_[Level]
      subject = parts[0];
      type = 'B';
      level = parts[2];
    } else if (parts[1] === 'ab' && parts[2] === 'initio') {
      // Pattern 2: [Subject]_ab_initio_[Level]
      subject = parts[0];
      type = 'ab_initio';
      level = parts[3];
    } else {
      console.log(`🔍 [Audio] Unknown type pattern: ${parts[1]} in ${filename}`);
      return null;
    }
    
    // Validate that we have a level
    if (level !== 'HL' && level !== 'SL') {
      console.log(`🔍 [Audio] Unknown level: ${level} in ${filename}`);
      return null;
    }
    
    // Return the full subject name (everything before .mp3)
    // This will be displayed in the Subject dropdown
    const subjectName = nameWithoutExt;
    
    console.log(`🔍 [Audio] Extracted subject '${subjectName}' from filename: ${filename}`);
    return subjectName;
  }

  // Get available subjects for a specific group by parsing PDF filenames
  async getAvailableSubjects(year, month, group) {
    try {
      await this.ensureInitialized();
      
      // Create cache key
      const cacheKey = `${year}-${month}-${group}`;
      
      // Return cached data if available
      if (this.cache.subjects.has(cacheKey)) {
        console.log(`🔍 [${year} ${month}] Using cached subjects for ${group}: ${this.cache.subjects.get(cacheKey).length} subjects`);
        return this.cache.subjects.get(cacheKey);
      }
      
      console.log(`🔍 [${year} ${month}] Getting subjects for group: ${group}`);
      
      // Get the subject folders for this year/month
      const subjectFolders = await this.getSubjectFolders(year, month);
      console.log(`🔍 [${year} ${month}] Found ${subjectFolders.length} subject folders:`, subjectFolders.map(f => f.name));
      
      // Find the specific group folder
      const targetGroupFolder = subjectFolders.find(folder => folder.name === group);
      
      if (!targetGroupFolder) {
        console.log(`🔍 [${year} ${month}] Group '${group}' not found. Available groups:`, subjectFolders.map(f => f.name));
        return [];
      }

      console.log(`🔍 [${year} ${month}] Found target group folder: ${targetGroupFolder.name} (ID: ${targetGroupFolder.id})`);

      // Check if this is the audio group and search for MP3 files instead of PDF files
      let files;
      if (group === 'Group Ex - Audio') {
        console.log(`🔍 [${year} ${month}] Detected Group Ex - Audio, searching for MP3 files`);
        files = await this.driveService.searchFiles(
          `'${targetGroupFolder.id}' in parents and (mimeType='audio/mpeg' or mimeType='audio/mp3' or name contains '.mp3') and trashed=false`
        );
        console.log(`🔍 [${year} ${month}] Found ${files.length} MP3 files in group '${group}'`);
      } else {
        // Get all PDF files directly in this group folder
        files = await this.driveService.searchFiles(
          `'${targetGroupFolder.id}' in parents and mimeType='application/pdf' and trashed=false`
        );
        console.log(`🔍 [${year} ${month}] Found ${files.length} PDF files in group '${group}'`);
      }
      
      // Log first few filenames for debugging
      if (files.length > 0) {
        console.log(`🔍 [${year} ${month}] Sample filenames:`, files.slice(0, 3).map(f => f.name));
      }

      // Extract unique subject names from filenames (batch processing)
      const subjects = new Set();
      
      // Process files in batches to avoid blocking
      const batchSize = 50;
      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        
        batch.forEach(file => {
          let subjectName;
          if (group === 'Group Ex - Audio') {
            // Use special parsing for audio files
            subjectName = this.extractSubjectFromAudioFilename(file.name);
          } else {
            // Use regular PDF parsing
            subjectName = this.extractSubjectFromFilename(file.name);
          }
          
          if (subjectName) {
            subjects.add(subjectName);
          }
        });
        
        // Log progress for large file sets
        if (files.length > 100 && i % (batchSize * 2) === 0) {
          console.log(`🔍 [${year} ${month}] Processed ${Math.min(i + batchSize, files.length)}/${files.length} files...`);
        }
      }

      // Convert Set to sorted array
      let uniqueSubjects = Array.from(subjects).sort();
      
      // For Group 2 (Language Acquisition), filter to only show subjects ending with _B or _ab_initio
      if (group === 'Group 2 - Language Acquisition') {
        uniqueSubjects = uniqueSubjects.filter(subject => 
          subject.endsWith('_B') || subject.endsWith('_ab_initio')
        );
        console.log(`🔍 [${year} ${month}] Filtered Group 2 subjects (only _B and _ab_initio):`, uniqueSubjects);
      }
      
      console.log(`🔍 [${year} ${month}] Found ${uniqueSubjects.length} unique subjects:`, uniqueSubjects.slice(0, 5).join(', ') + (uniqueSubjects.length > 5 ? '...' : ''));
      
      // Cache the result
      this.cache.subjects.set(cacheKey, uniqueSubjects);
      
      return uniqueSubjects;
    } catch (error) {
      console.error(`Error getting available subjects for ${year} ${month} ${group}:`, error);
      return [];
    }
  }
}

export default GoogleDriveFileService;
