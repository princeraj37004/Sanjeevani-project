const bcrypt = require('bcryptjs');
const { User, Community, Activity, CaseAlert } = require('../db');

async function seedDatabase() {
  try {
    // 1. Seed Users if empty
    const userCount = await User.countDocuments();
    let supervisor, worker1, worker2, worker3;
    
    if (userCount === 0) {
      console.log('Seeding initial users...');
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);

      supervisor = await User.create({
        name: 'Dr. Aarav Sharma',
        email: 'supervisor@health.gov.in',
        password: hashedPassword,
        role: 'supervisor',
        village: 'All Districts'
      });

      worker1 = await User.create({
        name: 'Sunita Devi',
        email: 'worker1@health.gov.in',
        password: hashedPassword,
        role: 'worker',
        village: 'Rampur'
      });

      worker2 = await User.create({
        name: 'Rajesh Kumar',
        email: 'worker2@health.gov.in',
        password: hashedPassword,
        role: 'worker',
        village: 'Karanpur'
      });

      worker3 = await User.create({
        name: 'Meena Kumari',
        email: 'worker3@health.gov.in',
        password: hashedPassword,
        role: 'worker',
        village: 'Gopalpur'
      });

      console.log('Users seeded successfully!');
    } else {
      // Fetch existing users for referencing in seeding below
      supervisor = await User.findOne({ email: 'supervisor@health.gov.in' });
      worker1 = await User.findOne({ email: 'worker1@health.gov.in' });
      worker2 = await User.findOne({ email: 'worker2@health.gov.in' });
      worker3 = await User.findOne({ email: 'worker3@health.gov.in' });
    }

    // 2. Seed Communities if empty
    const commCount = await Community.countDocuments();
    if (commCount === 0) {
      console.log('Seeding initial communities...');
      const communities = [
        { name: 'Rampur', district: 'Patna', population: 1200, healthWorker: 'Sunita Devi', lat: 25.5941, lng: 85.1376 },
        { name: 'Karanpur', district: 'Patna', population: 850, healthWorker: 'Rajesh Kumar', lat: 25.6120, lng: 85.1520 },
        { name: 'Gopalpur', district: 'Patna', population: 1500, healthWorker: 'Meena Kumari', lat: 25.5780, lng: 85.1050 },
        { name: 'Sonpur', district: 'Saran', population: 2200, healthWorker: 'Unassigned', lat: 25.6985, lng: 85.1725 },
        { name: 'Bihta', district: 'Patna', population: 3100, healthWorker: 'Unassigned', lat: 25.5606, lng: 84.8732 }
      ];

      for (const c of communities) {
        await Community.create(c);
      }
      console.log('Communities seeded successfully!');
    }

    // 3. Seed Activities if empty
    const activityCount = await Activity.countDocuments();
    if (activityCount === 0) {
      console.log('Seeding sample health worker activities...');
      
      // Mock activities over the last 15 days
      const activityTypes = ['visit', 'intervention', 'training'];
      const outcomes = {
        visit: ['Referred to District Hospital', 'Prescribed local medicine', 'Routine checkup completed', 'Prenatal counselling done'],
        intervention: ['Vaccinated child', 'Administered first aid', 'Distributed nutrition supplements', 'Conducted blood sugar test'],
        training: ['Conducted hygiene awareness session', 'Held family planning seminar', 'Organized sanitation workshop']
      };

      const patients = [
        { name: 'Ramesh Singh', age: 45, gender: 'Male' },
        { name: 'Anita Devi', age: 28, gender: 'Female' },
        { name: 'Pooja Kumari', age: 3, gender: 'Female' },
        { name: 'Rahul Yadav', age: 62, gender: 'Male' },
        { name: 'Vikram Prasad', age: 35, gender: 'Male' },
        { name: 'Sita Ram', age: 71, gender: 'Female' }
      ];

      const workers = [
        { id: worker1?._id || 'u2', name: worker1?.name || 'Sunita Devi', village: 'Rampur' },
        { id: worker2?._id || 'u3', name: worker2?.name || 'Rajesh Kumar', village: 'Karanpur' },
        { id: worker3?._id || 'u4', name: worker3?.name || 'Meena Kumari', village: 'Gopalpur' }
      ];

      // Generate 30 mock activities spread across dates
      for (let i = 0; i < 30; i++) {
        const w = workers[i % workers.length];
        const type = activityTypes[i % activityTypes.length];
        const p = patients[i % patients.length];
        
        const date = new Date();
        date.setDate(date.getDate() - (i % 12)); // Spread over 12 days

        const isUrgent = (i === 4 || i === 12 || i === 20); // 3 critical cases

        const act = await Activity.create({
          workerId: w.id,
          workerName: w.name,
          date: date.toISOString().split('T')[0],
          type: type,
          patientName: type === 'training' ? 'N/A (Group Training)' : p.name,
          patientAge: type === 'training' ? 0 : p.age,
          patientGender: type === 'training' ? 'N/A' : p.gender,
          village: w.village,
          details: type === 'training' 
            ? `Community training for ${20 + (i * 2)} villagers regarding healthy eating and sanitization.`
            : `${type.toUpperCase()} conducted for ${p.name} suffering from general sickness / routine tracking.`,
          outcome: outcomes[type][i % outcomes[type].length],
          isUrgent: isUrgent
        });

        // If case is urgent, seed a CaseAlert
        if (isUrgent) {
          await CaseAlert.create({
            activityId: act._id,
            workerId: w.id,
            workerName: w.name,
            village: w.village,
            patientName: p.name,
            details: `Urgent attention required. Patient ${p.name} (${p.age}/${p.gender}) requires immediate follow-up: ${act.outcome}.`,
            status: i === 4 ? 'resolved' : 'pending',
            resolvedBy: i === 4 ? 'Dr. Aarav Sharma' : '',
            resolutionNotes: i === 4 ? 'Patient visited by medical officer and medicine sent.' : ''
          });
        }
      }
      console.log('Sample activities and critical case alerts seeded successfully!');
    }
  } catch (err) {
    console.error('Error seeding database:', err);
  }
}

module.exports = seedDatabase;
