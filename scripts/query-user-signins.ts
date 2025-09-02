import { PrismaClient } from '@prisma/client'  
  
const prisma = new PrismaClient()  
  
async function main() {  
  try {  
    console.log('Querying users and their last sign-in times...\n')  
  
    const users = await prisma.user.findMany({  
      select: {  
        name: true,  
        email: true,  
        role: true,  
        department: true,  
        lastSignIn: true,  
        status: true  
      },  
      orderBy: [  
        { role: 'asc' },  
        { lastSignIn: 'desc' }  
      ]  
    })  
  
    console.log(`Found ${users.length} users\n`)  
  
    // Simple table format  
    console.log('Name - Email - Role - Department - Last Sign-in - Status') 
    console.log('-'.repeat(80))  
  
    for (const user of users) {  
      const lastSignIn = user.lastSignIn  
        ? user.lastSignIn.toLocaleDateString()  
        : 'Never'  
    }  
  
  } catch (error) {  
    console.error('Error:', error)  
  } finally {  
    await prisma.$disconnect()  
  }  
}  
  
main() 
