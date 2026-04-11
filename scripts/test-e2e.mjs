import { spawn } from 'child_process'

const prompt = "A modern blog platform for developers where users can read posts, create an account, log in, and leave comments on articles. It must include a user dashboard to manage profile settings."

async function runTest() {
  console.log('1. Starting Next.js dev server...')
  const devServer = spawn('npm', ['run', 'dev'], { stdio: 'pipe', shell: true })
  
  // Wait for server to be ready
  await new Promise((resolve) => {
    devServer.stdout.on('data', (data) => {
      const output = data.toString()
      if (output.includes('Ready in') || output.includes('started server')) {
        console.log('Dev server is ready.')
        resolve()
      }
    })
    
    // Also resolve after 15s fallback
    setTimeout(resolve, 15000)
  })

  try {
    console.log('\n2. Testing /api/plan (Architect Mode)...')
    const planRes = await fetch('http://localhost:3000/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    })
    
    if (!planRes.ok) throw new Error(`Plan failed: ${await planRes.text()}`)
    const planData = await planRes.json()
    console.log(`✅ Plan generated: ${planData.blueprint.name} (${planData.blueprint.pages[0].sections.length} sections)`)

    console.log('\n3. Testing /api/generate with the approved blueprint...')
    const genRes = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, blueprint: planData.blueprint }),
    })

    if (!genRes.ok) throw new Error(`Generate failed: ${await genRes.text()}`)
    
    const reader = genRes.body.getReader()
    const decoder = new TextDecoder()
    let previewUrl = null
    let totalMs = 0

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n\n')
      
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        try {
          const event = JSON.parse(line.slice(6))
          if (event.type === 'stage') {
            console.log(`⏳ Stage: ${event.data.message}`)
          }
          if (event.type === 'file') {
            console.log(`📝 Generated: ${event.data.path}`)
          }
          if (event.type === 'error') {
            console.error(`❌ Error from stream: ${event.data.message}`)
          }
          if (event.type === 'done') {
            previewUrl = event.data.previewUrl
            totalMs = event.data.totalMs
          }
        } catch (_) {}
      }
    }

    console.log(`\n✅ Generation complete in ${(totalMs / 1000).toFixed(1)}s!`)
    console.log(`🔗 Preview URL: ${previewUrl}`)

    console.log('\n4. Testing /api/projects (Project Dashboard)...')
    const projRes = await fetch('http://localhost:3000/api/projects')
    if (!projRes.ok) throw new Error(`Projects fetch failed: ${await projRes.text()}`)
    const projData = await projRes.json()
    console.log(`✅ Found ${projData.projects.length} saved projects in the store.`)
    
    const latest = projData.projects[0]
    console.log(`Latest Project: ${latest.name} (Status: ${latest.previewUrl ? 'Preview Ready' : 'Draft'})`)
    
  } catch (err) {
    console.error('\n❌ Test Failed:', err)
  } finally {
    console.log('\nCleaning up...')
    devServer.kill()
    process.exit(0)
  }
}

runTest()
