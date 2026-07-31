// ============================================================
// Sample Data for Kalikapur Nabin Sangha
// ============================================================

export const upcomingEvents = [
  {
    id: 1,
    title: "Rabindra Jayanti Celebration",
    date: "2026-05-08",
    time: "5:00 PM",
    venue: "Kalikapur Community Hall",
    description: "Join us for an evening of Rabindra Sangeet, recitation, and dance performances celebrating the legacy of Rabindranath Tagore.",
    category: "Cultural",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&h=400&fit=crop",
    publicReg: true,
    stagePreview: false,
    resultPublic: false
  },
  {
    id: 2,
    title: "Annual Sports Meet 2026",
    date: "2026-06-15",
    time: "8:00 AM",
    venue: "Kalikapur Playground",
    description: "Our annual inter-community sports meet featuring cricket, football, badminton, and athletics for all age groups.",
    category: "Sports",
    image: "https://images.unsplash.com/photo-1461896836934-bd45ba24e9c1?w=600&h=400&fit=crop",
    publicReg: false,
    stagePreview: false,
    resultPublic: false
  },
  {
    id: 3,
    title: "Art & Craft Workshop",
    date: "2026-05-25",
    time: "10:00 AM",
    venue: "KNS Activity Center",
    description: "A hands-on workshop for children and young adults covering painting, pottery, and origami. All materials provided.",
    category: "Workshop",
    image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&h=400&fit=crop",
    publicReg: false,
    stagePreview: false,
    resultPublic: false
  },
  {
    id: 4,
    title: "Community Health Camp",
    date: "2026-07-02",
    time: "9:00 AM",
    venue: "Kalikapur Park",
    description: "Free health checkups, blood pressure monitoring, diabetes screening, and health awareness talks by expert doctors.",
    category: "Health",
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&h=400&fit=crop",
    publicReg: false,
    stagePreview: false,
    resultPublic: false
  }
];

export const pastEvents = [
  {
    id: 101,
    title: "Durga Puja 2025",
    date: "2025-10-02",
    venue: "Kalikapur Puja Pandal",
    description: "A grand 5-day celebration with cultural programs, pandal decoration, and community feasting that brought together over 5000 visitors.",
    category: "Festival",
    image: "https://images.unsplash.com/photo-1569091791842-7cfb64e04797?w=600&h=400&fit=crop",
    highlights: ["5000+ Visitors", "Best Pandal Award", "Live Music"]
  },
  {
    id: 102,
    title: "Saraswati Puja 2026",
    date: "2026-02-14",
    venue: "KNS Community Center",
    description: "Beautiful Saraswati Puja celebration with pushpanjali, cultural performances, and community prasad distribution.",
    category: "Festival",
    image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&h=400&fit=crop",
    highlights: ["2000+ Devotees", "Cultural Night", "Book Fair"]
  },
  {
    id: 103,
    title: "Republic Day Program",
    date: "2026-01-26",
    venue: "Kalikapur Playground",
    description: "Flag hoisting ceremony followed by patriotic songs, drama, and a parade by our youth members.",
    category: "National",
    image: "https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=600&h=400&fit=crop",
    highlights: ["500+ Participants", "Youth Parade", "Award Ceremony"]
  }
];

export const galleryImages = [
  { id: 1, src: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=400&fit=crop", title: "Annual Celebration 2025", category: "Events" },
  { id: 2, src: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop", title: "Community Gathering", category: "Events" },
  { id: 3, src: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&h=400&fit=crop", title: "Cultural Performance", category: "Culture" },
  { id: 4, src: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=600&h=400&fit=crop", title: "Music Night", category: "Culture" },
  { id: 5, src: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=400&fit=crop", title: "Sports Day", category: "Sports" },
  { id: 6, src: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600&h=400&fit=crop", title: "Volunteer Work", category: "Community" },
  { id: 7, src: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&h=400&fit=crop", title: "Puja Decoration", category: "Festival" },
  { id: 8, src: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=600&h=400&fit=crop", title: "Stage Setup", category: "Events" },
  { id: 9, src: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=600&h=400&fit=crop", title: "Award Ceremony", category: "Events" },
  { id: 10, src: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&h=400&fit=crop", title: "Planning Session", category: "Community" },
  { id: 11, src: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop", title: "Dance Performance", category: "Culture" },
  { id: 12, src: "https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=600&h=400&fit=crop", title: "Team Building", category: "Community" },
  { id: 13, src: "Sports/photo_6127538719637049299_y.jpg", title: "Sports Action 1", category: "Sports" },
  { id: 14, src: "Sports/photo_6127538719637049300_y.jpg", title: "Sports Action 2", category: "Sports" }
];

export const notices = [
  {
    id: 1,
    title: "Annual General Meeting – All Members Required",
    date: "2026-04-20",
    priority: "urgent",
    content: "The Annual General Meeting of Kalikapur Nabin Sangha will be held on April 20, 2026 at 6 PM. All registered members must attend. Agenda includes election of new committee members and budget review.",
    pinned: true
  },
  {
    id: 2,
    title: "Rabindra Jayanti Rehearsal Schedule",
    date: "2026-04-18",
    priority: "important",
    content: "All performers for the Rabindra Jayanti program must attend rehearsals starting April 18. Schedule: Singers - 4 PM, Dancers - 5:30 PM, Drama - 7 PM at the community hall.",
    pinned: true
  },
  {
    id: 3,
    title: "Membership Renewal Deadline Extended",
    date: "2026-04-30",
    priority: "general",
    content: "The deadline for membership renewal has been extended to April 30, 2026. Please visit the office or contact the secretary to complete your renewal. Late fees apply after the deadline.",
    pinned: false
  },
  {
    id: 4,
    title: "New Batch: Music & Dance Classes Starting",
    date: "2026-05-01",
    priority: "important",
    content: "We are starting new batches for Rabindra Sangeet, Hindustani Classical, and Bharatanatyam. Registration open until April 25. Limited seats available.",
    pinned: false
  },
  {
    id: 5,
    title: "Community Clean-Up Drive – Volunteers Needed",
    date: "2026-04-22",
    priority: "general",
    content: "Join us for a community clean-up drive on Earth Day, April 22. Meeting point: Kalikapur Park at 7 AM. Refreshments will be provided.",
    pinned: false
  }
];

export const workItems = [
  {
    id: 1,
    title: "Community Library Setup",
    status: "completed",
    description: "Established a community library with 2000+ books covering literature, science, and children's books. Free membership for all residents.",
    date: "2025-08-15",
    progress: 100
  },
  {
    id: 2,
    title: "Kalikapur Park Renovation",
    status: "completed",
    description: "Complete renovation of the community park including new play equipment, walking paths, seating areas, and solar-powered lights.",
    date: "2025-11-20",
    progress: 100
  },
  {
    id: 3,
    title: "Digital Education Center",
    status: "in-progress",
    description: "Setting up a digital education center with 20 computers, high-speed internet, and free coding classes for youth.",
    date: "2026-03-01",
    progress: 65
  },
  {
    id: 4,
    title: "Community Health Initiative",
    status: "in-progress",
    description: "Monthly health camps, yoga sessions, and wellness workshops for community members. Partnered with local hospitals.",
    date: "2026-02-15",
    progress: 45
  },
  {
    id: 5,
    title: "Cultural Heritage Museum",
    status: "planned",
    description: "Planning a small museum to preserve and showcase the cultural heritage of Kalikapur with artifacts, photographs, and documents.",
    date: "2026-06-01",
    progress: 10
  },
  {
    id: 6,
    title: "Street Light Installation Drive",
    status: "completed",
    description: "Installed 50 LED streetlights across Kalikapur area in collaboration with the local municipality.",
    date: "2025-06-10",
    progress: 100
  }
];

export const partners = [
  { id: 1, name: "Kolkata Municipal Corp.", icon: "fas fa-landmark", color: "#0ea5e9", website: "#", tagline: "Serving the City of Joy" },
  { id: 2, name: "State Bank of India", icon: "fas fa-university", color: "#2563eb", website: "#", tagline: "With You All The Way" },
  { id: 3, name: "Apollo Hospitals", icon: "fas fa-hospital", color: "#dc2626", website: "#", tagline: "Touching Lives" },
  { id: 4, name: "Jadavpur University", icon: "fas fa-graduation-cap", color: "#7c3aed", website: "#", tagline: "To Know Is to Grow" },
  { id: 5, name: "Tata Trust", icon: "fas fa-hands-helping", color: "#0891b2", website: "#", tagline: "For the Nation's Progress" },
  { id: 6, name: "Bengal Chamber", icon: "fas fa-briefcase", color: "#d97706", website: "#", tagline: "Connecting Business" },
  { id: 7, name: "Indian Oil Corp.", icon: "fas fa-gas-pump", color: "#059669", website: "#", tagline: "In Service to the Nation" },
  { id: 8, name: "Rotary Club Kolkata", icon: "fas fa-globe", color: "#e11d48", website: "#", tagline: "Service Above Self" },
  { id: 9, name: "Bandhan Bank", icon: "fas fa-building", color: "#004b87", website: "#", tagline: "Aapka Bhala, Sabki Deeksha" },
  { id: 10, name: "Techno India Group", icon: "fas fa-university", color: "#eab308", website: "#", tagline: "Empowering Minds" },
  { id: 11, name: "Amrit Cement", icon: "fas fa-hard-hat", color: "#b91c1c", website: "#", tagline: "Solid Strength, Trusted Bonds" },
  { id: 12, name: "Peerless Hospital", icon: "fas fa-plus-square", color: "#15803d", website: "#", tagline: "Care You Can Trust" }
];

export const teamMembers = [
  { name: "Subrata Das", role: "President", icon: "fas fa-crown" },
  { name: "Rina Mukherjee", role: "Vice President", icon: "fas fa-star" },
  { name: "Amit Roy", role: "Secretary", icon: "fas fa-pen-fancy" },
  { name: "Priya Banerjee", role: "Treasurer", icon: "fas fa-coins" },
  { name: "Rajesh Ghosh", role: "Cultural Secretary", icon: "fas fa-music" },
  { name: "Suman Chatterjee", role: "Sports Secretary", icon: "fas fa-futbol" }
];
