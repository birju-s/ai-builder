import { spawn } from 'child_process'

async function runTest() {
  console.log('1. Starting Next.js dev server for GitHub Sync test...')
  const devServer = spawn('npm', ['run', 'dev'], { stdio: 'pipe', shell: true })
  
  // Wait for server to be ready
  await new Promise((resolve) => {
    devServer.stdout.on('data', (data) => {
      const output = data.toString()
      if (output.includes('Ready in') || output.includes('started server') || output.includes('ready started')) {
        resolve()
      }
    })
    setTimeout(resolve, 10000)
  })
  
  console.log('Dev server ready.')

  try {
    const projRes = await fetch('http://localhost:3000/api/projects')
    if (!projRes.ok) throw new Error(`Projects fetch failed: ${await projRes.text()}`)
    const projData = await projRes.json()
    console.log(`Found ${projData.projects.length} saved projects.`)
    
    if (projData.projects.length === 0) {
      console.log('No projects found to test GitHub sync. Skipping.')
      return
    }

    const latest = projData.projects[0]
    console.log(`Testing GitHub Sync for project: ${latest.id}`)

    const ghRes = await fetch(`http://localhost:3000/api/projects/${latest.id}/github`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}), // Intentionally sending no token, relying on env var (which is empty)
    })
    
    const ghData = await ghRes.json()
    if (ghRes.status === 401 && ghData.error.includes('GitHub token is required')) {
      console.log('✅ GitHub Sync API rejected unauthorized request as expected:', ghData.error)
    } else if (ghRes.ok) {
      console.log('✅ GitHub Sync successful!', ghData)
    } else {
      console.error('❌ GitHub Sync returned unexpected error:', ghData)
    }
  } catch (err) {
    console.error('❌ Test Failed:', err)
  } finally {
    console.log('Cleaning up...')
    devServer.kill()
    process.exit(0)
  }
}

runTest()
