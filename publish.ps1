# 우리학교 웹 버전을 GitHub 에 처음 올리고 GitHub Pages 를 켜요. (한 번만 실행)
#   & .\publish.ps1
$ErrorActionPreference = 'Stop'
$gh = 'C:\Program Files\GitHub CLI\gh.exe'
Set-Location $PSScriptRoot

Write-Host '1/3 공개 저장소 shu8e46/uri-school 만들고 올리는 중...'
& $gh repo create uri-school --public --description '우리학교 - 급식, 시간표(컴시간 변경 반영), 학사일정 웹 앱' --source . --remote origin --push

Write-Host '2/3 GitHub Pages 켜는 중...'
& $gh api -X POST repos/shu8e46/uri-school/pages -f 'source[branch]=main' -f 'source[path]=/' | Out-Null

Write-Host '3/3 컴시간 시간표 첫 수집 실행...'
& $gh workflow run comci.yml --repo shu8e46/uri-school

Write-Host ''
Write-Host '완료! 1~2분 뒤 열려요: https://shu8e46.github.io/uri-school/'
