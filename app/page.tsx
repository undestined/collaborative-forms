import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, FileText, Zap } from "lucide-react";
import { Navbar } from "@/components/ui/navbar";
import CreateSection from "@/components/create-section";

export default function Home() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <Navbar />
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Form<span className="text-primary">Sync</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Create and collaborate on forms in real-time. Like Google Docs, but
            for structured forms.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/forms">
              <Button size="lg" className="text-lg px-8">
                Get Started
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="text-lg px-8">
              Learn More
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <FileText className="w-12 h-12 mx-auto mb-4 text-primary" />
              <CardTitle>Create Forms</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Build beautiful, responsive forms with our intuitive
                drag-and-drop interface.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="w-12 h-12 mx-auto mb-4 text-primary" />
              <CardTitle>Real-time Collaboration</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Work together with your team to fill out forms simultaneously,
                just like Google Docs.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Zap className="w-12 h-12 mx-auto mb-4 text-primary" />
              <CardTitle>Instant Sync</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                See changes instantly as they happen. No more waiting or
                refreshing required.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <CreateSection />
      </div>
    </div>
  );
}
